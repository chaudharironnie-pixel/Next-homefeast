import { OAuth2Client } from 'google-auth-library';
import logger from '../utils/logger';
import AppError from '../utils/AppError';
import ErrorCodes from '../utils/errorCodes';

const GOOGLE_ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

let client: OAuth2Client | null = null;

const getClient = () => {
  if (!client) {
    if (!process.env.GOOGLE_CLIENT_ID) {
      logger.error('GOOGLE_CLIENT_ID is not configured');
      throw new AppError('Google Sign-In is not configured', 503, ErrorCodes.GOOGLE_AUTH_FAILED);
    }
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return client;
};

export interface GoogleIdentity {
  subject: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  issuer: string;
  audience: string;
}

export const verifyCredential = async (credential: string): Promise<GoogleIdentity> => {
  if (!credential || typeof credential !== 'string') {
    throw new AppError('Google credential is required', 400, ErrorCodes.GOOGLE_TOKEN_INVALID);
  }

  try {
    const ticket = await getClient().verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError('Invalid Google credential', 401, ErrorCodes.GOOGLE_TOKEN_INVALID);
    }

    const { sub, email, email_verified: emailVerified, name, picture, iss, aud, exp } = payload;

    if (!sub || !email) {
      throw new AppError('Invalid Google identity', 401, ErrorCodes.GOOGLE_TOKEN_INVALID);
    }

    if (!GOOGLE_ISSUERS.includes(iss || '')) {
      logger.warn('Google token issuer mismatch', { iss });
      throw new AppError('Invalid Google token issuer', 401, ErrorCodes.GOOGLE_TOKEN_INVALID);
    }

    if (aud !== process.env.GOOGLE_CLIENT_ID) {
      logger.warn('Google token audience mismatch', { aud });
      throw new AppError('Invalid Google token audience', 401, ErrorCodes.GOOGLE_TOKEN_INVALID);
    }

    if (exp && Date.now() >= exp * 1000) {
      throw new AppError('Google token has expired', 401, ErrorCodes.GOOGLE_TOKEN_INVALID);
    }

    if (!emailVerified) {
      throw new AppError('Google email is not verified', 400, ErrorCodes.GOOGLE_ACCOUNT_NOT_ALLOWED);
    }

    return {
      subject: sub,
      email: email.toLowerCase().trim(),
      emailVerified: true,
      name: name || null,
      picture: picture || null,
      issuer: iss || '',
      audience: aud || '',
    };
  } catch (err) {
    if (err instanceof AppError) throw err;

    logger.warn('Google credential verification failed', {
      error: (err as Error).message,
    });

    throw new AppError('Google authentication failed. Please try again.', 401, ErrorCodes.GOOGLE_AUTH_FAILED);
  }
};

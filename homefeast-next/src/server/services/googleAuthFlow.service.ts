import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { userRepository, PUBLIC_SELECT } from '../repositories/user.repository';
import { verifyCredential, type GoogleIdentity } from './googleAuth.service';
import { signAccessToken, signRefreshToken } from './token.service';
import AppError from '../utils/AppError';
import ErrorCodes from '../utils/errorCodes';
import logger from '../utils/logger';

const GOOGLE_PLACEHOLDER_PHONE_PREFIX = '+91G';

const generatePlaceholderPhone = (googleSubject: string) => {
  const digits = googleSubject.replace(/\D/g, '').slice(-9).padStart(9, '0');
  return `${GOOGLE_PLACEHOLDER_PHONE_PREFIX}${digits}`;
};

export const isPlaceholderPhone = (phone: string | null | undefined) =>
  phone?.startsWith(GOOGLE_PLACEHOLDER_PHONE_PREFIX);

const buildName = (gi: GoogleIdentity) => {
  if (gi.name) return gi.name.slice(0, 60);
  const [localPart] = gi.email.split('@');
  return localPart.slice(0, 60);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TransactionClient = any;

const upsertGoogleAuthAccount = async (userId: string, gi: GoogleIdentity, tx: TransactionClient = prisma) => {
  await tx.authAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: 'GOOGLE',
        providerAccountId: gi.subject,
      },
    },
    update: { email: gi.email, name: gi.name, picture: gi.picture },
    create: {
      userId,
      provider: 'GOOGLE',
      providerAccountId: gi.subject,
      email: gi.email,
      name: gi.name,
      picture: gi.picture,
    },
  });
};

const issueAuthTokens = async (userId: string, role: string) => {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId);
  const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await userRepository.update(userId, { refreshToken: hashedRefresh });
  return { accessToken, refreshToken };
};

export interface GoogleAuthResult {
  user: Record<string, unknown>;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

export const authenticateGoogle = async (credential: string): Promise<GoogleAuthResult> => {
  const googleIdentity = await verifyCredential(credential);

  // Case 1: User already signed up with Google.
  let user = await userRepository.findByGoogleId(googleIdentity.subject);
  if (user) {
    if (!user.isActive) {
      throw new AppError('Account deactivated. Contact support.', 403, ErrorCodes.ACCOUNT_DISABLED);
    }
    const { accessToken, refreshToken } = await issueAuthTokens(user.id, user.role);
    await userRepository.update(user.id, { lastLoginAt: new Date() });
    return { user, accessToken, refreshToken, isNewUser: false };
  }

  // Case 2: Email/password account exists → link Google.
  const existingUser = await userRepository.findByEmailWithSecrets(googleIdentity.email);
  if (existingUser) {
    if (!existingUser.isActive) {
      throw new AppError('Account deactivated. Contact support.', 403, ErrorCodes.ACCOUNT_DISABLED);
    }
    const updates = {
      googleId: googleIdentity.subject,
      provider: (existingUser.provider === 'GOOGLE' ? 'GOOGLE' : 'BOTH') as 'GOOGLE' | 'BOTH',
      avatar: existingUser.avatar || googleIdentity.picture,
      isEmailVerified: true,
      lastLoginAt: new Date(),
    };
    const linkedUser = await userRepository.update(existingUser.id, updates);
    await upsertGoogleAuthAccount(linkedUser.id, googleIdentity);
    const { accessToken, refreshToken } = await issueAuthTokens(linkedUser.id, linkedUser.role);
    return { user: linkedUser, accessToken, refreshToken, isNewUser: false };
  }

  // Case 3: New user.
  const newUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: buildName(googleIdentity),
        email: googleIdentity.email,
        phone: generatePlaceholderPhone(googleIdentity.subject),
        password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12),
        role: 'customer',
        provider: 'GOOGLE',
        googleId: googleIdentity.subject,
        avatar: googleIdentity.picture,
        isEmailVerified: true,
      },
      select: PUBLIC_SELECT,
    });
    await upsertGoogleAuthAccount(user.id, googleIdentity, tx);
    return user;
  });

  const { accessToken, refreshToken } = await issueAuthTokens(newUser.id, newUser.role);
  await userRepository.update(newUser.id, { lastLoginAt: new Date() });
  return { user: newUser, accessToken, refreshToken, isNewUser: true };
};

import { NextRequest } from 'next/server';
import { verifyAccessToken } from '../services/token.service';
import { userRepository } from '../repositories/user.repository';
import AppError from '../utils/AppError';
import ErrorCodes from '../utils/errorCodes';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  avatar: string | null;
}

export const authenticate = async (request: NextRequest): Promise<AuthUser> => {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError('No token provided', 401, ErrorCodes.UNAUTHORIZED);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await userRepository.findById(decoded.id);

    if (!user || !user.isActive) {
      throw new AppError('User not found or deactivated', 401, ErrorCodes.UNAUTHORIZED);
    }

    return user as AuthUser;
  } catch (err) {
    if (err instanceof AppError) throw err;
    const jwtErr = err as { name?: string };
    if (jwtErr.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401, ErrorCodes.AUTH_TOKEN_INVALID);
    }
    if (jwtErr.name === 'TokenExpiredError') {
      throw new AppError('Token expired', 401, ErrorCodes.AUTH_TOKEN_EXPIRED);
    }
    throw new AppError('Authentication failed', 401, ErrorCodes.UNAUTHORIZED);
  }
};

export const authorize = (user: AuthUser, ...roles: string[]) => {
  if (!roles.includes(user.role)) {
    throw new AppError('Access denied: insufficient permissions', 403, ErrorCodes.FORBIDDEN);
  }
};

import jwt, { type SignOptions } from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || '';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

export const signAccessToken = (id: string, role: string) =>
  jwt.sign({ id, role }, ACCESS_SECRET, { expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as SignOptions['expiresIn'] });

export const signRefreshToken = (id: string) =>
  jwt.sign({ id }, REFRESH_SECRET, { expiresIn: (process.env.JWT_REFRESH_EXPIRES || '7d') as SignOptions['expiresIn'] });

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, REFRESH_SECRET) as jwt.JwtPayload;

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, ACCESS_SECRET) as jwt.JwtPayload;

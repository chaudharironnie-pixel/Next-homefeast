import { NextRequest } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { userRepository } from '@/server/repositories/user.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/server/services/token.service';
import { authenticateGoogle } from '@/server/services/googleAuthFlow.service';
import { sendEmail, emailTemplates } from '@/server/utils/email';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import { registerSchema, loginSchema, forgotPasswordSchema, verifyEmailOtpSchema, resendEmailOtpSchema, changeUnverifiedEmailSchema, googleAuthSchema } from '@/server/validators/auth.validator';
import AppError from '@/server/utils/AppError';
import ErrorCodes from '@/server/utils/errorCodes';
import logger from '@/server/utils/logger';

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_RESEND_ATTEMPTS = 5;
const MAX_OTP_ATTEMPTS = 5;
const PHONE_REGEX = /^\+?[1-9]\d{9,14}$/;

const normalizePhone = (raw: string) => {
  if (!raw || typeof raw !== 'string') return null;
  const stripped = raw.replace(/\s/g, '');
  const digitsOnly = stripped.replace(/\D/g, '');
  if (!digitsOnly) return null;
  if (stripped.startsWith('+')) return `+${digitsOnly}`;
  if (/^\d{10}$/.test(digitsOnly)) return `+91${digitsOnly}`;
  return null;
};

const isValidPhone = (raw: string) => normalizePhone(raw) !== null;

const generateOtp = () => String(crypto.randomInt(100000, 1000000));
const hashOtp = (otp: string) => crypto.createHash('sha256').update(otp).digest('hex');

const buildAuthUser = (user: Record<string, unknown>) => ({
  id: user.id, name: user.name, email: user.email, phone: user.phone,
  role: user.role, provider: user.provider, googleId: user.googleId,
  avatar: user.avatar, isEmailVerified: user.isEmailVerified,
});

const buildOnboardingState = (user: Record<string, unknown>, provider: Record<string, unknown> | null = null) => {
  if (!user.isActive) return { required: true, nextStep: 'ACCOUNT_DISABLED', message: 'Account deactivated. Contact support.' };
  if (!user.isEmailVerified) return { required: true, nextStep: 'EMAIL_VERIFICATION', message: 'Please verify your email.' };
  if (user.role === 'provider') {
    if (!provider) return { required: true, nextStep: 'PROVIDER_PROFILE', message: 'Please complete your provider profile.' };
    const p = provider as Record<string, unknown>;
    if (p.status === 'pending') return { required: true, nextStep: 'PROVIDER_APPROVAL_PENDING', message: 'Your provider account is pending approval.' };
    if (p.status === 'rejected') return { required: true, nextStep: 'PROVIDER_REJECTED', message: 'Your provider application was rejected.' };
    if (p.status === 'suspended') return { required: true, nextStep: 'PROVIDER_SUSPENDED', message: 'Your provider account is suspended.' };
  }
  return { required: false, nextStep: null, message: 'Onboarding complete' };
};

const buildCookieOptions = () => {
  const maxAge = 7 * 24 * 60 * 60 * 1000;
  return `Path=/; HttpOnly; Max-Age=${maxAge}; SameSite=${process.env.NODE_ENV === 'production' ? 'None; Secure' : 'Lax'}`;
};

const setRefreshCookie = (response: Response, refreshToken: string) => {
  const headers = new Headers(response.headers);
  headers.append('Set-Cookie', `refreshToken=${refreshToken}; ${buildCookieOptions()}`);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};

const issueTokens = async (userId: string, role: string) => {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId);
  const hashedRefresh = crypto.createHash('sha256').update(refreshToken).digest('hex');
  await userRepository.update(userId, { refreshToken: hashedRefresh });
  return { accessToken, refreshToken };
};

const sendEmailOtp = async (user: Record<string, unknown>, isResend = false) => {
  const now = new Date();
  if (isResend) {
    if (user.emailOtpSentAt && now.getTime() - new Date(user.emailOtpSentAt as string).getTime() < RESEND_COOLDOWN_MS) {
      const remaining = Math.ceil((RESEND_COOLDOWN_MS - (now.getTime() - new Date(user.emailOtpSentAt as string).getTime())) / 1000);
      throw new AppError(`Please wait ${remaining}s before requesting a new OTP`, 429, ErrorCodes.TOO_MANY_REQUESTS);
    }
    if ((user.emailOtpResendCount as number) >= MAX_RESEND_ATTEMPTS) {
      throw new AppError('Maximum resend attempts exceeded.', 429, ErrorCodes.TOO_MANY_REQUESTS);
    }
  }
  const otp = generateOtp();
  const hashedOtp = hashOtp(otp);
  const expires = new Date(Date.now() + OTP_EXPIRY_MS);
  const updateData: Record<string, unknown> = {
    emailOtpHash: hashedOtp, emailOtpExpires: expires, emailOtpSentAt: now, emailOtpAttempts: 0,
  };
  if (isResend) updateData.emailOtpResendCount = { increment: 1 };
  else updateData.emailOtpResendCount = 0;
  await userRepository.update(user.id as string, updateData);
  const { previewUrl } = await sendEmail({
    to: user.email as string,
    subject: 'HomeFeast – Verify your email',
    html: emailTemplates.verifyEmail(otp, user.name as string),
  });
  return { hashedOtp, expires, previewUrl };
};

const handleRegister = async (request: NextRequest) => {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return sendError('Validation failed', 400, ErrorCodes.VALIDATION_FAILED, parsed.error.flatten().fieldErrors);

  const { name, email, phone, password, role = 'customer' } = parsed.data;
  if (!['customer', 'provider'].includes(role)) return sendError('Invalid role', 400, ErrorCodes.VALIDATION_FAILED);
  if (!phone || !isValidPhone(phone)) return sendError('Please enter a valid 10-digit phone number', 400, ErrorCodes.PHONE_INVALID);
  const normalizedPhone = normalizePhone(phone)!;

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) return sendError('Email already registered', 409, ErrorCodes.USER_EMAIL_ALREADY_EXISTS);
  const existingPhone = await userRepository.findByPhone(normalizedPhone);
  if (existingPhone) return sendError('Phone number already registered', 409, ErrorCodes.USER_PHONE_ALREADY_EXISTS);

  const hashedPassword = await bcrypt.hash(password, 12);
  let user: Record<string, unknown>;

  if (role === 'provider') {
    const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { name, email, phone: normalizedPhone, password: hashedPassword, role },
        select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, isActive: true, isEmailVerified: true, lastLoginAt: true, createdAt: true, updatedAt: true },
      });
      await tx.provider.create({ data: { userId: createdUser.id, businessName: name, slug } });
      return createdUser;
    });
  } else {
    user = await userRepository.create({ name, email, phone: normalizedPhone, password: hashedPassword, role });
  }

  const { previewUrl } = await sendEmailOtp(user);
  const responseData: Record<string, unknown> = { userId: user.id, email: user.email };
  if (previewUrl && process.env.NODE_ENV === 'development') responseData.previewUrl = previewUrl;
  return sendSuccess(responseData, 'Registration successful. Please check your email for the OTP.', 201);
};

const handleLogin = async (request: NextRequest) => {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return sendError('Validation failed', 400, ErrorCodes.VALIDATION_FAILED, parsed.error.flatten().fieldErrors);

  const { email, password } = parsed.data;
  const user = await userRepository.findByEmailWithSecrets(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return sendError('Invalid email or password', 401, ErrorCodes.AUTH_INVALID_CREDENTIALS);
  }
  if (!user.isActive) return sendError('Account deactivated. Contact support.', 403, 'ACCOUNT_DEACTIVATED' as string);
  if (!user.isEmailVerified) return sendError('Please verify your email before logging in.', 403, 'EMAIL_NOT_VERIFIED' as string);

  const provider = user.role === 'provider' ? await providerRepository.findByUserId(user.id) : null;
  const { accessToken, refreshToken } = await issueTokens(user.id, user.role);
  await userRepository.update(user.id, { lastLoginAt: new Date() });

  const userData = await userRepository.findById(user.id);
  const response = {
    accessToken,
    user: buildAuthUser(userData as unknown as Record<string, unknown>),
    onboarding: buildOnboardingState(userData as unknown as Record<string, unknown>, provider as unknown as Record<string, unknown>),
  };

  const res = sendSuccess(response);
  return setRefreshCookie(res, refreshToken);
};

const handleRefreshToken = async (request: NextRequest) => {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/refreshToken=([^;]+)/);
  const token = tokenMatch?.[1];
  if (!token) return sendError('No refresh token', 401, ErrorCodes.AUTH_REFRESH_TOKEN_INVALID);

  try {
    const decoded = verifyRefreshToken(token);
    const user = await userRepository.findByIdWithSecrets(decoded.id);
    if (!user) return sendError('User not found', 401, ErrorCodes.AUTH_REFRESH_TOKEN_INVALID);

    const hashedIncoming = crypto.createHash('sha256').update(token).digest('hex');
    if (user.refreshToken !== hashedIncoming) {
      await userRepository.update(user.id, { refreshToken: null });
      return sendError('Token reuse detected. Please login again.', 401, ErrorCodes.AUTH_REFRESH_TOKEN_INVALID);
    }

    const { accessToken, refreshToken: newRefreshToken } = await issueTokens(user.id, user.role);
    const res = sendSuccess({ accessToken });
    return setRefreshCookie(res, newRefreshToken);
  } catch (err) {
    if (err instanceof AppError) return sendError(err.message, err.statusCode, err.errorCode || undefined);
    return sendError('Invalid or expired refresh token', 401, ErrorCodes.AUTH_REFRESH_TOKEN_INVALID);
  }
};

const handleLogout = async (request: NextRequest) => {
  try {
    const user = await authenticate(request);
    await userRepository.update(user.id, { refreshToken: null });
    const res = sendSuccess(null, 'Logged out successfully');
    const headers = new Headers(res.headers);
    headers.append('Set-Cookie', 'refreshToken=; Path=/; HttpOnly; Max-Age=0');
    return new Response(res.body, { status: res.status, headers });
  } catch (err) {
    return handleApiError(err);
  }
};

const handleForgotPassword = async (request: NextRequest) => {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) return sendError('Validation failed', 400, ErrorCodes.VALIDATION_FAILED);

  const user = await userRepository.findByEmail(parsed.data.email);
  if (!user) return sendSuccess(null, 'If that email exists, a reset link was sent');

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expires = new Date(Date.now() + 10 * 60 * 1000);
  await userRepository.update(user.id, { passwordResetToken: hashedToken, passwordResetExpires: expires });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await sendEmail({ to: user.email, subject: 'HomeFeast – Password Reset', html: emailTemplates.resetPassword(resetUrl, user.name) });
  return sendSuccess(null, 'If that email exists, a reset link was sent');
};

const handleVerifyEmailOtp = async (request: NextRequest) => {
  const body = await request.json();
  const parsed = verifyEmailOtpSchema.safeParse(body);
  if (!parsed.success) return sendError('Validation failed', 400, ErrorCodes.VALIDATION_FAILED);

  const { email, otp } = parsed.data;
  const user = await userRepository.findByEmailWithSecrets(email);
  if (!user) return sendError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
  if (user.isEmailVerified) return sendError('Email already verified', 400);
  if (!user.emailOtpHash || !user.emailOtpExpires) return sendError('No OTP requested', 400, ErrorCodes.AUTH_OTP_INVALID);
  if (new Date() > user.emailOtpExpires) return sendError('OTP expired', 400);
  if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) return sendError('Too many failed attempts', 429, ErrorCodes.TOO_MANY_REQUESTS);

  const hashedInput = hashOtp(otp);
  if (user.emailOtpHash !== hashedInput) {
    await userRepository.update(user.id, { emailOtpAttempts: { increment: 1 } });
    const remaining = MAX_OTP_ATTEMPTS - (user.emailOtpAttempts + 1);
    if (remaining <= 0) return sendError('Too many failed attempts', 429);
    return sendError(`Invalid OTP. ${remaining} attempt(s) remaining.`, 400, ErrorCodes.AUTH_OTP_INVALID);
  }

  await userRepository.update(user.id, {
    isEmailVerified: true, emailOtpHash: null, emailOtpExpires: null,
    emailOtpSentAt: null, emailOtpAttempts: 0, emailOtpResendCount: 0,
  });

  const provider = user.role === 'provider' ? await providerRepository.findByUserId(user.id) : null;
  sendEmail({ to: user.email, subject: 'Welcome to HomeFeast', html: emailTemplates.welcome(user.name) }).catch((e) => logger.warn('Welcome email failed', { error: (e as Error).message }));

  const { accessToken, refreshToken } = await issueTokens(user.id, user.role);
  await userRepository.update(user.id, { lastLoginAt: new Date() });
  const userData = await userRepository.findById(user.id);

  const response = {
    accessToken,
    user: buildAuthUser(userData as unknown as Record<string, unknown>),
    onboarding: buildOnboardingState(userData as unknown as Record<string, unknown>, provider as unknown as Record<string, unknown>),
  };

  const res = sendSuccess(response, 'Email verified successfully');
  return setRefreshCookie(res, refreshToken);
};

const handleResendEmailOtp = async (request: NextRequest) => {
  const body = await request.json();
  const parsed = resendEmailOtpSchema.safeParse(body);
  if (!parsed.success) return sendError('Validation failed', 400, ErrorCodes.VALIDATION_FAILED);

  const user = await userRepository.findByEmailWithSecrets(parsed.data.email);
  if (!user) return sendError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
  if (user.isEmailVerified) return sendError('Email already verified', 400);

  const { previewUrl } = await sendEmailOtp(user, true);
  const responseData: Record<string, unknown> = { email: user.email };
  if (previewUrl && process.env.NODE_ENV === 'development') responseData.previewUrl = previewUrl;
  return sendSuccess(responseData, 'OTP resent successfully');
};

const handleChangeUnverifiedEmail = async (request: NextRequest) => {
  const body = await request.json();
  const parsed = changeUnverifiedEmailSchema.safeParse(body);
  if (!parsed.success) return sendError('Validation failed', 400, ErrorCodes.VALIDATION_FAILED);

  const { currentEmail, newEmail, password } = parsed.data;
  const user = await userRepository.findByEmailWithSecrets(currentEmail);
  if (!user) return sendError('User not found', 404, ErrorCodes.USER_NOT_FOUND);
  if (user.isEmailVerified) return sendError('Email already verified.', 400);
  if (!(await bcrypt.compare(password, user.password))) return sendError('Incorrect password', 401, ErrorCodes.AUTH_INVALID_CREDENTIALS);

  const existingUser = await userRepository.findByEmail(newEmail);
  if (existingUser && existingUser.id !== user.id) return sendError('New email is already registered', 409, ErrorCodes.USER_EMAIL_ALREADY_EXISTS);

  await userRepository.update(user.id, {
    email: newEmail, isEmailVerified: false,
    emailOtpHash: null, emailOtpExpires: null, emailOtpSentAt: null, emailOtpResendCount: 0,
  });

  const updatedUser = await userRepository.findByEmailWithSecrets(newEmail);
  if (!updatedUser) return sendError('User not found', 404);
  const { previewUrl } = await sendEmailOtp(updatedUser);
  const responseData: Record<string, unknown> = { userId: updatedUser.id, email: updatedUser.email };
  if (previewUrl && process.env.NODE_ENV === 'development') responseData.previewUrl = previewUrl;
  return sendSuccess(responseData, 'Email updated. Please verify your new email.');
};

const handleGoogleAuth = async (request: NextRequest) => {
  const body = await request.json();
  const parsed = googleAuthSchema.safeParse(body);
  if (!parsed.success) return sendError('Validation failed', 400, ErrorCodes.VALIDATION_FAILED);

  const { user, accessToken, refreshToken, isNewUser } = await authenticateGoogle(parsed.data.credential);
  const providerProfile = user.role === 'provider' ? await providerRepository.findByUserId(user.id as string) : null;

  const response = {
    accessToken,
    user: buildAuthUser(user),
    onboarding: buildOnboardingState(user, providerProfile as unknown as Record<string, unknown>),
  };

  const res = sendSuccess(response, isNewUser ? 'Google sign-up successful' : 'Google login successful', isNewUser ? 201 : 200);
  return setRefreshCookie(res, refreshToken);
};

const handleGetMe = async (request: NextRequest) => {
  const user = await authenticate(request);
  return sendSuccess({ user });
};

const handleUpdateMe = async (request: NextRequest) => {
  const user = await authenticate(request);
  const body = await request.json();
  const { name, phone, avatar } = body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) {
    if (!isValidPhone(phone)) return sendError('Invalid phone number format', 400, ErrorCodes.PHONE_INVALID);
    updates.phone = normalizePhone(phone);
  }
  if (avatar !== undefined) updates.avatar = avatar;
  const updatedUser = await userRepository.update(user.id, updates);
  return sendSuccess({ user: updatedUser });
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    if (action === 'me') return handleGetMe(request);
    return sendError('Not found', 404);
  } catch (err) { return handleApiError(err); }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    switch (action) {
      case 'register': return handleRegister(request);
      case 'login': return handleLogin(request);
      case 'refresh-token': return handleRefreshToken(request);
      case 'logout': return handleLogout(request);
      case 'forgot-password': return handleForgotPassword(request);
      case 'verify-email-otp': return handleVerifyEmailOtp(request);
      case 'resend-email-otp': return handleResendEmailOtp(request);
      case 'change-unverified-email': return handleChangeUnverifiedEmail(request);
      case 'google': return handleGoogleAuth(request);
      default: return sendError('Not found', 404);
    }
  } catch (err) { return handleApiError(err); }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    if (action === 'me') return handleUpdateMe(request);
    return sendError('Not found', 404);
  } catch (err) { return handleApiError(err); }
}

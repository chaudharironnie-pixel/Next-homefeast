import { z } from 'zod';

const PHONE_REGEX = /^\+?\d{10,15}$/;

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60),
  email: z.string().email('Valid email required'),
  phone: z.string().trim().min(1, 'Phone number is required').regex(PHONE_REGEX, 'Enter a valid 10-digit phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().optional(),
  role: z.enum(['customer', 'provider']).optional(),
}).refine((data) => !data.confirmPassword || data.confirmPassword === data.password, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Valid email required'),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.confirmPassword === data.password, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email('Valid email required'),
  otp: z.string().length(6, 'Valid 6-digit OTP required').regex(/^\d+$/, 'OTP must be numeric'),
});

export const resendEmailOtpSchema = z.object({
  email: z.string().email('Valid email required'),
});

export const changeUnverifiedEmailSchema = z.object({
  currentEmail: z.string().email('Valid current email required'),
  newEmail: z.string().email('Valid new email required'),
  password: z.string().min(1, 'Password is required'),
});

export const googleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

import { NextRequest } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { userRepository } from '@/server/repositories/user.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { resetPasswordSchema } from '@/server/validators/auth.validator';
import ErrorCodes from '@/server/utils/errorCodes';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return sendError('Validation failed', 400, ErrorCodes.VALIDATION_FAILED, parsed.error.flatten().fieldErrors);
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await userRepository.findByResetToken(hashedToken);
    if (!user) return sendError('Token invalid or expired', 400, ErrorCodes.AUTH_TOKEN_INVALID);

    const hashedPassword = await bcrypt.hash(parsed.data.password, 12);
    await userRepository.update(user.id, {
      password: hashedPassword,
      passwordResetToken: null,
      passwordResetExpires: null,
      refreshToken: null,
    });

    return sendSuccess(null, 'Password reset successful. Please login.');
  } catch (err) {
    return handleApiError(err);
  }
}

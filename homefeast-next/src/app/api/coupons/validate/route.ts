import { NextRequest } from 'next/server';
import { couponRepository } from '@/server/repositories/coupon.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const { code, orderAmount } = body;

    if (!code || orderAmount === undefined) {
      return sendError('code and orderAmount are required', 400, ErrorCodes.VALIDATION_FAILED);
    }

    const result = await couponRepository.validate(code, user.id, orderAmount);
    if (!result.valid) {
      return sendError(result.message || 'Invalid coupon', 400, ErrorCodes.COUPON_INVALID);
    }

    return sendSuccess({ discount: result.discount, couponId: result.coupon?.id });
  } catch (err) {
    return handleApiError(err);
  }
}

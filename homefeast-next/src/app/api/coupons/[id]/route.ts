import { NextRequest } from 'next/server';
import { couponRepository } from '@/server/repositories/coupon.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const { id } = await params;
    const body = await request.json();
    const coupon = await couponRepository.update(id, body);
    return sendSuccess({ coupon }, 'Coupon updated');
  } catch (err) {
    return handleApiError(err);
  }
}

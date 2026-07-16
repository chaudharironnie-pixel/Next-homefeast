import { NextRequest } from 'next/server';
import { couponRepository } from '@/server/repositories/coupon.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [coupons, total] = await couponRepository.findAll({ skip, take: limit });
    const pages = Math.ceil(total / limit);
    return sendSuccess({ coupons, total, page, pages });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const body = await request.json();
    const coupon = await couponRepository.create(body);
    return sendSuccess({ coupon }, 'Coupon created', 201);
  } catch (err) {
    return handleApiError(err);
  }
}

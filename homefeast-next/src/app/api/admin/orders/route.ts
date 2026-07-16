import { NextRequest } from 'next/server';
import { orderRepository } from '@/server/repositories/order.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await orderRepository.findAll({ status, search, skip, take: limit });
    const pages = Math.ceil(total / limit);
    return sendSuccess({ orders, total, page, pages });
  } catch (err) {
    return handleApiError(err);
  }
}

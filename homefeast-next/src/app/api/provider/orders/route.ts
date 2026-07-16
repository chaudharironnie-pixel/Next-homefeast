import { NextRequest } from 'next/server';
import { orderRepository } from '@/server/repositories/order.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const provider = await providerRepository.findByUserId(user.id);
    if (!provider) return sendError('Provider profile not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await orderRepository.findByProvider(provider.id, { status, skip, take: limit });
    const pages = Math.ceil(total / limit);
    return sendSuccess({ orders, total, page, pages });
  } catch (err) {
    return handleApiError(err);
  }
}

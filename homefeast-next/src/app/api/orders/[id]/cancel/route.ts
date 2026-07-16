import { NextRequest } from 'next/server';
import { orderRepository } from '@/server/repositories/order.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    const { id } = await params;
    const order = await orderRepository.findById(id);
    if (!order) return sendError('Order not found', 404, ErrorCodes.ORDER_NOT_FOUND);

    if (order.customerId !== user.id) {
      return sendError('Access denied', 403, ErrorCodes.FORBIDDEN);
    }

    if (order.status !== 'pending') {
      return sendError('Only pending orders can be cancelled', 400, ErrorCodes.ORDER_INVALID_STATUS);
    }

    const updated = await orderRepository.update(id, { status: 'cancelled' });
    return sendSuccess({ order: updated }, 'Order cancelled');
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from 'next/server';
import { orderRepository } from '@/server/repositories/order.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { earningRepository } from '@/server/repositories/earning.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['preparing'],
  preparing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
};

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    const { id } = await params;
    const order = await orderRepository.findById(id);
    if (!order) return sendError('Order not found', 404, ErrorCodes.ORDER_NOT_FOUND);

    if (user.role === 'admin') return sendSuccess({ order });

    if (user.role === 'customer' && order.customerId === user.id) return sendSuccess({ order });

    if (user.role === 'provider') {
      const provider = await providerRepository.findByUserId(user.id);
      if (provider && provider.id === order.providerId) return sendSuccess({ order });
    }

    return sendError('Access denied', 403, ErrorCodes.FORBIDDEN);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    const order = await orderRepository.findById(id);
    if (!order) return sendError('Order not found', 404, ErrorCodes.ORDER_NOT_FOUND);

    const provider = await providerRepository.findByUserId(user.id);
    if (!provider || provider.id !== order.providerId) {
      return sendError('Access denied', 403, ErrorCodes.FORBIDDEN);
    }

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed || !allowed.includes(status)) {
      return sendError('Invalid status transition', 400, ErrorCodes.ORDER_INVALID_STATUS);
    }

    const updates: Record<string, unknown> = { status };
    if (status === 'rejected' && rejectionReason) updates.rejectionReason = rejectionReason;

    const updated = await orderRepository.update(id, updates);

    if (status === 'delivered') {
      await providerRepository.incrementStats(provider.id, { orders: 1, earnings: Number(order.total) });

      const commission = Number(order.total) * 0.1;
      const netAmount = Number(order.total) - commission;
      await earningRepository.create({
        providerId: provider.id,
        orderId: order.id,
        amount: Number(order.total),
        commission,
        netAmount,
      });
    }

    return sendSuccess({ order: updated }, 'Order status updated');
  } catch (err) {
    return handleApiError(err);
  }
}

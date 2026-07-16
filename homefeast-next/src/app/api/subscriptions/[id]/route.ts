import { NextRequest } from 'next/server';
import { subscriptionRepository } from '@/server/repositories/subscription.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    const { id } = await params;
    const subscription = await subscriptionRepository.findById(id);
    if (!subscription) return sendError('Subscription not found', 404, ErrorCodes.SUBSCRIPTION_NOT_FOUND);

    if (user.role === 'admin') return sendSuccess({ subscription });

    if (user.role === 'customer' && subscription.customerId === user.id) return sendSuccess({ subscription });

    if (user.role === 'provider') {
      const provider = await providerRepository.findByUserId(user.id);
      if (provider && provider.id === subscription.providerId) return sendSuccess({ subscription });
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
    const { action } = body;

    const subscription = await subscriptionRepository.findById(id);
    if (!subscription) return sendError('Subscription not found', 404, ErrorCodes.SUBSCRIPTION_NOT_FOUND);

    if (subscription.customerId !== user.id) {
      return sendError('Access denied', 403, ErrorCodes.FORBIDDEN);
    }

    if (subscription.status === 'cancelled') {
      return sendError('Cannot modify cancelled subscription', 400, ErrorCodes.SUBSCRIPTION_ALREADY_CANCELLED);
    }

    let updates: Record<string, unknown> = {};

    switch (action) {
      case 'cancel':
        updates = { status: 'cancelled' };
        break;
      case 'pause':
        if (subscription.status !== 'active') {
          return sendError('Only active subscriptions can be paused', 400, ErrorCodes.SUBSCRIPTION_INVALID_STATUS);
        }
        updates = { status: 'paused', pausedUntil: body.pausedUntil || null };
        break;
      case 'resume':
        if (subscription.status !== 'paused') {
          return sendError('Only paused subscriptions can be resumed', 400, ErrorCodes.SUBSCRIPTION_INVALID_STATUS);
        }
        updates = { status: 'active', pausedUntil: null };
        break;
      default:
        return sendError('Invalid action. Use cancel, pause, or resume', 400, ErrorCodes.VALIDATION_FAILED);
    }

    const updated = await subscriptionRepository.update(id, updates);
    return sendSuccess({ subscription: updated }, 'Subscription updated');
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from 'next/server';
import { reviewRepository } from '@/server/repositories/review.repository';
import { orderRepository } from '@/server/repositories/order.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import { notifyNewReview } from '@/server/services/notification.service';
import ErrorCodes from '@/server/utils/errorCodes';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const { orderId, rating, comment, images } = body;

    if (!orderId || !rating) {
      return sendError('orderId and rating are required', 400, ErrorCodes.VALIDATION_FAILED);
    }

    const order = await orderRepository.findById(orderId);
    if (!order) return sendError('Order not found', 404, ErrorCodes.ORDER_NOT_FOUND);
    if (order.customerId !== user.id) return sendError('Access denied', 403, ErrorCodes.FORBIDDEN);
    if (order.status !== 'delivered') return sendError('Can only review delivered orders', 400, ErrorCodes.ORDER_INVALID_STATUS);

    const existing = await reviewRepository.findByOrder(orderId);
    if (existing) return sendError('Review already exists for this order', 409, ErrorCodes.CONFLICT);

    const review = await reviewRepository.create({
      customerId: user.id,
      providerId: order.providerId,
      orderId,
      rating,
      comment: comment || null,
      images: images || [],
    });

    const { rating: avgRating, totalReviews } = await reviewRepository.calculateProviderRating(order.providerId);
    await providerRepository.updateRating(order.providerId, { rating: avgRating, totalReviews });

    const provider = await providerRepository.findById(order.providerId);
    if (provider) {
      notifyNewReview(provider.userId, user.name).catch(() => {});
    }

    return sendSuccess({ review }, 'Review created', 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    if (!providerId) return sendError('providerId is required', 400, ErrorCodes.VALIDATION_FAILED);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [reviews, total] = await reviewRepository.findByProvider(providerId, { skip, take: limit });
    const pages = Math.ceil(total / limit);
    return sendSuccess({ reviews, total, page, pages });
  } catch (err) {
    return handleApiError(err);
  }
}

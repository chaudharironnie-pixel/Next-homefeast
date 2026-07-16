import { NextRequest } from 'next/server';
import { providerRepository } from '@/server/repositories/provider.repository';
import { orderRepository } from '@/server/repositories/order.repository';
import { subscriptionRepository } from '@/server/repositories/subscription.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const provider = await providerRepository.findByUserId(user.id);
    if (!provider) return sendError('Provider profile not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [monthlyData, activeSubscriptions] = await Promise.all([
      orderRepository.monthlyRevenue(provider.id, monthStart),
      subscriptionRepository.count({ providerId: provider.id, status: 'active' }),
    ]);

    return sendSuccess({
      monthlyOrders: monthlyData._count.id,
      monthlyRevenue: monthlyData._sum.total || 0,
      totalOrders: provider.totalOrders,
      totalEarnings: provider.totalEarnings,
      rating: provider.rating,
      totalReviews: provider.totalReviews,
      activeSubscriptions,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

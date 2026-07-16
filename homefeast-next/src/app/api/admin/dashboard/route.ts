import { NextRequest } from 'next/server';
import { userRepository } from '@/server/repositories/user.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { orderRepository } from '@/server/repositories/order.repository';
import { subscriptionRepository } from '@/server/repositories/subscription.repository';
import { complaintRepository } from '@/server/repositories/complaint.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const [
      totalUsers,
      activeUsers,
      totalProviders,
      activeProviders,
      monthlyOrders,
      revenueData,
      activeSubscriptions,
      openComplaints,
    ] = await Promise.all([
      userRepository.count(),
      userRepository.count({ isActive: true }),
      providerRepository.count(),
      providerRepository.count({ status: 'approved', isAvailable: true }),
      orderRepository.count({ createdAt: { gte: monthStart } }),
      orderRepository.revenueChart(sixMonthsAgo),
      subscriptionRepository.count({ status: 'active' }),
      complaintRepository.count({ status: 'open' }),
    ]);

    return sendSuccess({
      totalUsers,
      activeUsers,
      totalProviders,
      activeProviders,
      monthlyOrders,
      revenueData,
      activeSubscriptions,
      openComplaints,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

import { prisma } from '@/lib/prisma';

export const reviewRepository = {
  findByProvider: (providerId: string, { skip, take }: { skip: number; take: number }) => {
    const where = { providerId, isVisible: true };
    return Promise.all([
      prisma.review.findMany({
        where,
        include: { customer: { select: { id: true, name: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip, take,
      }),
      prisma.review.count({ where }),
    ]);
  },

  findByOrder: (orderId: string) =>
    prisma.review.findUnique({ where: { orderId } }),

  create: (data: Parameters<typeof prisma.review.create>[0]['data']) => prisma.review.create({ data }),

  update: (id: string, data: Record<string, unknown>, providerId?: string) =>
    prisma.review.update({ where: { id, ...(providerId ? { providerId } : {}) }, data }),

  calculateProviderRating: async (providerId: string) => {
    const result = await prisma.review.aggregate({
      where: { providerId, isVisible: true },
      _avg: { rating: true },
      _count: { id: true },
    });
    return {
      rating: result._avg.rating ? Math.round(result._avg.rating * 10) / 10 : 0,
      totalReviews: result._count.id,
    };
  },
};

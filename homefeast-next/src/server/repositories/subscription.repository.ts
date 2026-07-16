import { prisma } from '@/lib/prisma';

export const subscriptionRepository = {
  findById: (id: string) =>
    prisma.subscription.findFirst({
      where: { id, deletedAt: null },
      include: {
        provider: { select: { id: true, businessName: true, coverImage: true, city: true } },
        mealPlan: true,
      },
    }),

  findByCustomer: (customerId: string) =>
    prisma.subscription.findMany({
      where: { customerId, deletedAt: null },
      include: { provider: { select: { id: true, businessName: true, coverImage: true } }, mealPlan: true },
      orderBy: { createdAt: 'desc' },
    }),

  findByProvider: (providerId: string) =>
    prisma.subscription.findMany({
      where: { providerId, deletedAt: null },
      include: { customer: { select: { id: true, name: true, phone: true } }, mealPlan: true },
      orderBy: { createdAt: 'desc' },
    }),

  findActiveExpiringSoon: (days: number) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return prisma.subscription.findMany({
      where: { status: 'active', endDate: { lte: cutoff }, deletedAt: null },
      include: { customer: true },
    });
  },

  create: (data: Parameters<typeof prisma.subscription.create>[0]['data']) => prisma.subscription.create({ data }),

  update: (id: string, data: Record<string, unknown>) => prisma.subscription.update({ where: { id }, data }),

  count: (where: Record<string, unknown>) => prisma.subscription.count({ where: { ...where, deletedAt: null } }),
};

import { prisma } from '@/lib/prisma';

export const mealPlanRepository = {
  findById: (id: string) =>
    prisma.mealPlan.findFirst({ where: { id, deletedAt: null } }),

  findByProvider: (providerId: string) =>
    prisma.mealPlan.findMany({
      where: { providerId, isActive: true, deletedAt: null },
      orderBy: { pricePerMonth: 'asc' },
    }),

  create: (data: Parameters<typeof prisma.mealPlan.create>[0]['data']) => prisma.mealPlan.create({ data }),

  update: (id: string, providerId: string, data: Record<string, unknown>) =>
    prisma.mealPlan.update({ where: { id, providerId }, data }),

  softDelete: (id: string, providerId: string) =>
    prisma.mealPlan.update({ where: { id, providerId }, data: { deletedAt: new Date() } }),
};

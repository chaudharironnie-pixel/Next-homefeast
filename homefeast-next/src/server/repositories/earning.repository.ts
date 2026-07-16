import { prisma } from '@/lib/prisma';

export const earningRepository = {
  findByProvider: (providerId: string, { skip = 0, take = 20 }: { skip?: number; take?: number } = {}) =>
    Promise.all([
      prisma.earning.findMany({ where: { providerId }, orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.earning.count({ where: { providerId } }),
    ]),

  summary: (providerId: string) =>
    prisma.earning.aggregate({
      where: { providerId },
      _sum: { amount: true, commission: true, netAmount: true },
    }),

  create: (data: Parameters<typeof prisma.earning.create>[0]['data']) => prisma.earning.create({ data }),

  unsettledTotal: (providerId: string) =>
    prisma.earning.aggregate({
      where: { providerId, settledAt: null },
      _sum: { netAmount: true },
    }),
};

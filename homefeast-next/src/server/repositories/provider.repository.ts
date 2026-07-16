import { prisma } from '@/lib/prisma';

export const providerRepository = {
  findById: (id: string) =>
    prisma.provider.findUnique({
      where: { id, deletedAt: null },
      include: {
        user: { select: { id: true, name: true, avatar: true, email: true } },
        cuisines: { include: { cuisine: true } },
        operatingDays: true,
        serviceAreas: true,
      },
    }),

  findByUserId: (userId: string) =>
    prisma.provider.findFirst({
      where: { userId, deletedAt: null },
      include: { cuisines: { include: { cuisine: true } } },
    }),

  findMany: ({ city, cuisineId, minRating, search, skip, take }: {
    city?: string; cuisineId?: string; minRating?: string; search?: string; skip?: number; take?: number;
  }) => {
    const where: Record<string, unknown> = { status: 'approved', isAvailable: true, deletedAt: null };
    if (city) (where as Record<string, unknown>).city = { contains: city, mode: 'insensitive' };
    if (minRating) (where as Record<string, unknown>).rating = { gte: parseFloat(minRating) };
    if (cuisineId) (where as Record<string, unknown>).cuisines = { some: { cuisineId } };
    if (search) (where as Record<string, unknown>).businessName = { contains: search, mode: 'insensitive' };

    return Promise.all([
      prisma.provider.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          cuisines: { include: { cuisine: { select: { name: true } } } },
        },
        orderBy: { rating: 'desc' },
        skip,
        take,
      }),
      prisma.provider.count({ where }),
    ]);
  },

  findPending: () =>
    prisma.provider.findMany({
      where: { status: 'pending', deletedAt: null },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),

  findOrCreateByUserId: async (userId: string, userName: string) => {
    let provider = await prisma.provider.findFirst({ where: { userId, deletedAt: null } });
    if (!provider) {
      const slug = `${userName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
      provider = await prisma.provider.create({
        data: { userId, businessName: userName, slug, isAvailable: true },
      });
    }
    return prisma.provider.findFirst({
      where: { id: provider.id },
      include: { cuisines: { include: { cuisine: true } } },
    });
  },

  create: (data: Parameters<typeof prisma.provider.create>[0]['data']) => prisma.provider.create({ data }),

  update: (id: string, data: Parameters<typeof prisma.provider.update>[0]['data']) => prisma.provider.update({ where: { id }, data }),

  updateByUserId: (userId: string, data: Parameters<typeof prisma.provider.update>[0]['data']) => prisma.provider.update({ where: { userId }, data }),

  count: (where: Record<string, unknown> = {}) =>
    prisma.provider.count({ where: { ...where, deletedAt: null } }),

  incrementStats: (id: string, { orders = 0, earnings = 0 }: { orders?: number; earnings?: number }) =>
    prisma.provider.update({
      where: { id },
      data: { totalOrders: { increment: orders }, totalEarnings: { increment: earnings } },
    }),

  updateRating: (id: string, { rating, totalReviews }: { rating: number; totalReviews: number }) =>
    prisma.provider.update({ where: { id }, data: { rating, totalReviews } }),
};

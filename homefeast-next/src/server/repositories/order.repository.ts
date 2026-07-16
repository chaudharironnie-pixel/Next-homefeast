import { prisma } from '@/lib/prisma';

export const orderRepository = {
  findById: (id: string) =>
    prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        provider: { select: { id: true, businessName: true, coverImage: true, city: true } },
        items: true,
        customer: { select: { id: true, name: true, phone: true } },
        payment: true,
        review: { select: { id: true, rating: true, comment: true } },
      },
    }),

  findByCustomer: (customerId: string, { status, skip, take }: { status?: string; skip: number; take: number }) => {
    const where: Record<string, unknown> = { customerId, deletedAt: null };
    if (status) where.status = status;
    return Promise.all([
      prisma.order.findMany({
        where,
        include: {
          provider: { select: { id: true, businessName: true, coverImage: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        skip, take,
      }),
      prisma.order.count({ where }),
    ]);
  },

  findByProvider: (providerId: string, { status, skip, take }: { status?: string; skip: number; take: number }) => {
    const where: Record<string, unknown> = { providerId, deletedAt: null };
    if (status) where.status = status;
    return Promise.all([
      prisma.order.findMany({
        where,
        include: { customer: { select: { id: true, name: true, phone: true } }, items: true },
        orderBy: { createdAt: 'desc' },
        skip, take,
      }),
      prisma.order.count({ where }),
    ]);
  },

  findAll: ({ status, search, skip, take }: { status?: string; search?: string; skip: number; take: number }) => {
    const where: Record<string, unknown> = { deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    return Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          provider: { select: { id: true, businessName: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip, take,
      }),
      prisma.order.count({ where }),
    ]);
  },

  create: (data: Parameters<typeof prisma.order.create>[0]['data']) =>
    prisma.order.create({
      data,
      include: { items: true, provider: { select: { businessName: true } } },
    }),

  update: (id: string, data: Record<string, unknown>) => prisma.order.update({ where: { id }, data }),

  count: (where: Record<string, unknown>) => prisma.order.count({ where: { ...where, deletedAt: null } }),

  monthlyRevenue: (providerId: string, monthStart: Date) =>
    prisma.order.aggregate({
      where: { providerId, createdAt: { gte: monthStart }, deletedAt: null, status: { not: 'cancelled' } },
      _count: { id: true },
      _sum: { total: true },
    }),

  revenueChart: (since: Date) =>
    prisma.$queryRaw`
      SELECT EXTRACT(YEAR FROM created_at)::int AS year, EXTRACT(MONTH FROM created_at)::int AS month, COUNT(*)::int AS orders, SUM(total) AS revenue
      FROM orders WHERE status = 'delivered' AND created_at >= ${since} AND deleted_at IS NULL
      GROUP BY year, month ORDER BY year, month
    `,
};

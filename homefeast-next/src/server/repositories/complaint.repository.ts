import { prisma } from '@/lib/prisma';

export const complaintRepository = {
  findByCustomer: (customerId: string) =>
    prisma.complaint.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    }),

  findAll: ({ status, priority, skip, take }: { status?: string; priority?: string; skip: number; take: number }) => {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    return Promise.all([
      prisma.complaint.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, email: true } },
          provider: { select: { id: true, businessName: true } },
        },
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip, take,
      }),
      prisma.complaint.count({ where }),
    ]);
  },

  create: (data: Parameters<typeof prisma.complaint.create>[0]['data']) => prisma.complaint.create({ data }),

  update: (id: string, data: Record<string, unknown>) => prisma.complaint.update({ where: { id }, data }),

  count: (where: Record<string, unknown>) => prisma.complaint.count({ where }),
};

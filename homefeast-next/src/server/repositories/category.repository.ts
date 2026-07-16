import { prisma } from '@/lib/prisma';

export const categoryRepository = {
  findAll: () =>
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    }),

  findById: (id: string) => prisma.category.findUnique({ where: { id } }),

  create: (data: Parameters<typeof prisma.category.create>[0]['data']) => prisma.category.create({ data }),

  update: (id: string, data: Record<string, unknown>) => prisma.category.update({ where: { id }, data }),

  softDelete: (id: string) => prisma.category.update({ where: { id }, data: { isActive: false } }),
};

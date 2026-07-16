import { prisma } from '@/lib/prisma';

export const menuRepository = {
  findById: (id: string) =>
    prisma.menuItem.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        cuisine: { select: { id: true, name: true } },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    }),

  findByProvider: (providerId: string, filters: { mealType?: string; cuisineId?: string; isVeg?: boolean; minPrice?: string; maxPrice?: string } = {}) => {
    const where: Record<string, unknown> = { providerId, isAvailable: true, deletedAt: null };
    if (filters.mealType) where.mealType = filters.mealType;
    if (filters.cuisineId) where.cuisineId = filters.cuisineId;
    if (filters.isVeg === true || filters.isVeg === false) where.isVeg = filters.isVeg;
    if (filters.minPrice || filters.maxPrice) {
      const price: Record<string, number> = {};
      if (filters.minPrice) price.gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) price.lte = parseFloat(filters.maxPrice);
      where.price = price;
    }
    return prisma.menuItem.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { sortOrder: 'asc' },
    });
  },

  findByProviderAll: (providerId: string) =>
    prisma.menuItem.findMany({
      where: { providerId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        images: { take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    }),

  findManyByIds: (ids: string[]) =>
    prisma.menuItem.findMany({ where: { id: { in: ids }, isAvailable: true, deletedAt: null } }),

  create: (data: { providerId: string; name: string; description?: string; price: number; mealType: string; isVeg?: boolean; categoryId: string; cuisineId?: string; preparationTime?: number; calories?: number; imageUrl?: string }) => {
    const { imageUrl, ...rest } = data;
    return prisma.menuItem.create({
      data: {
        ...rest,
        ...(imageUrl ? { images: { create: { url: imageUrl, isPrimary: true, sortOrder: 0 } } } : {}),
      },
    });
  },

  update: (id: string, providerId: string, data: Record<string, unknown>) =>
    prisma.menuItem.update({ where: { id, providerId }, data }),

  softDelete: (id: string, providerId: string) =>
    prisma.menuItem.update({ where: { id, providerId }, data: { deletedAt: new Date() } }),
};

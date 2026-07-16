import { prisma } from '@/lib/prisma';

export const addressRepository = {
  findByUser: (userId: string) =>
    prisma.userAddress.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] }),

  findById: (id: string, userId: string) =>
    prisma.userAddress.findFirst({ where: { id, userId } }),

  create: async (userId: string, data: Record<string, unknown>) => {
    if (data.isDefault) {
      await prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.userAddress.create({ data: { ...data, userId } } as never);
  },

  update: async (id: string, userId: string, data: Record<string, unknown>) => {
    if (data.isDefault) {
      await prisma.userAddress.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return prisma.userAddress.update({ where: { id }, data });
  },

  delete: (id: string) => prisma.userAddress.delete({ where: { id } }),
};

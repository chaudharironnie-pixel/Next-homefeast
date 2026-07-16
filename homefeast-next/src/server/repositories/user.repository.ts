import { prisma } from '@/lib/prisma';

export const PUBLIC_SELECT = {
  id: true, name: true, email: true, phone: true,
  role: true, provider: true, googleId: true, avatar: true, isActive: true,
  isEmailVerified: true, lastLoginAt: true,
  createdAt: true, updatedAt: true,
} as const;

export const userRepository = {
  findById: (id: string) =>
    prisma.user.findFirst({ where: { id, deletedAt: null }, select: PUBLIC_SELECT }),

  findByEmail: (email: string) =>
    prisma.user.findFirst({ where: { email, deletedAt: null }, select: PUBLIC_SELECT }),

  findByEmailWithSecrets: (email: string) =>
    prisma.user.findFirst({ where: { email, deletedAt: null } }),

  findByIdWithSecrets: (id: string) =>
    prisma.user.findFirst({ where: { id, deletedAt: null } }),

  findByPhone: (phone: string) =>
    prisma.user.findFirst({ where: { phone, deletedAt: null }, select: PUBLIC_SELECT }),

  findByGoogleId: (googleId: string) =>
    prisma.user.findFirst({ where: { googleId, deletedAt: null }, select: PUBLIC_SELECT }),

  findByResetToken: (hashedToken: string) =>
    prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
        deletedAt: null,
      },
      select: { id: true, email: true },
    }),

  create: (data: Parameters<typeof prisma.user.create>[0]['data']) =>
    prisma.user.create({ data, select: PUBLIC_SELECT }),

  update: (id: string, data: Parameters<typeof prisma.user.update>[0]['data']) =>
    prisma.user.update({ where: { id }, data, select: PUBLIC_SELECT }),

  findMany: ({ role, isActive, search, skip, take }: {
    role?: string; isActive?: boolean; search?: string; skip?: number; take?: number;
  }) => {
    const where: Record<string, unknown> = { deletedAt: null };
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    return Promise.all([
      prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: PUBLIC_SELECT }),
      prisma.user.count({ where }),
    ]);
  },

  count: (where: Record<string, unknown> = {}) =>
    prisma.user.count({ where: { ...where, deletedAt: null } }),
};

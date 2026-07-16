import { prisma } from '@/lib/prisma';

export const notificationRepository = {
  findByRecipient: (recipientId: string, limit = 50) =>
    prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }),

  countUnread: (recipientId: string) =>
    prisma.notification.count({ where: { recipientId, isRead: false } }),

  create: (data: Parameters<typeof prisma.notification.create>[0]['data']) => prisma.notification.create({ data }),

  markAsRead: (id: string, recipientId: string) =>
    prisma.notification.update({ where: { id, recipientId }, data: { isRead: true } }),

  markAllAsRead: (recipientId: string) =>
    prisma.notification.updateMany({ where: { recipientId, isRead: false }, data: { isRead: true } }),
};

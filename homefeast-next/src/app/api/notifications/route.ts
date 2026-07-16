import { NextRequest } from 'next/server';
import { notificationRepository } from '@/server/repositories/notification.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const notifications = await notificationRepository.findByRecipient(user.id);
    const unreadCount = await notificationRepository.countUnread(user.id);
    return sendSuccess({ notifications, unreadCount });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticate(request);
    await notificationRepository.markAllAsRead(user.id);
    return sendSuccess(null, 'All notifications marked as read');
  } catch (err) {
    return handleApiError(err);
  }
}

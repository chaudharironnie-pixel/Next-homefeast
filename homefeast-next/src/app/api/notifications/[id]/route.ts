import { NextRequest } from 'next/server';
import { notificationRepository } from '@/server/repositories/notification.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    const { id } = await params;
    const notification = await notificationRepository.markAsRead(id, user.id);
    return sendSuccess({ notification }, 'Notification marked as read');
  } catch (err) {
    return handleApiError(err);
  }
}

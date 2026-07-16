import { NextRequest } from 'next/server';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';
import { notifyProviderApproved } from '@/server/services/notification.service';
import ErrorCodes from '@/server/utils/errorCodes';
import logger from '@/server/utils/logger';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body;

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      return sendError('Invalid status. Must be approved, rejected, or suspended', 400, ErrorCodes.VALIDATION_FAILED);
    }

    const provider = await providerRepository.findById(id);
    if (!provider) return sendError('Provider not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const updates: Record<string, unknown> = { status };
    if (status === 'rejected' && rejectionReason) updates.rejectionReason = rejectionReason;

    const updated = await providerRepository.update(id, updates);

    if (status === 'approved') {
      notifyProviderApproved(provider.userId).catch((e) =>
        logger.warn('Notification failed', { error: (e as Error).message })
      );
    }

    return sendSuccess({ provider: updated }, `Provider ${status}`);
  } catch (err) {
    return handleApiError(err);
  }
}

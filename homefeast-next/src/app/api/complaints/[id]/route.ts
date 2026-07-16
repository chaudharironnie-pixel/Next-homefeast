import { NextRequest } from 'next/server';
import { complaintRepository } from '@/server/repositories/complaint.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const { id } = await params;
    const body = await request.json();
    const { resolution } = body;

    if (!resolution) {
      return sendError('resolution is required', 400, ErrorCodes.VALIDATION_FAILED);
    }

    const complaint = await complaintRepository.update(id, {
      status: 'resolved',
      resolution,
      resolvedById: user.id,
      resolvedAt: new Date(),
    });

    return sendSuccess({ complaint }, 'Complaint resolved');
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from 'next/server';
import { reviewRepository } from '@/server/repositories/review.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    authorize(user, 'provider');

    const provider = await providerRepository.findByUserId(user.id);
    if (!provider) return sendError('Provider profile not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const { id } = await params;
    const body = await request.json();
    const { providerReply } = body;

    const review = await reviewRepository.update(id, {
      providerReply,
      providerRepliedAt: new Date(),
    }, provider.id);

    return sendSuccess({ review }, 'Reply added');
  } catch (err) {
    return handleApiError(err);
  }
}

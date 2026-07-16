import { NextRequest } from 'next/server';
import { subscriptionRepository } from '@/server/repositories/subscription.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const provider = await providerRepository.findByUserId(user.id);
    if (!provider) return sendError('Provider profile not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const subscriptions = await subscriptionRepository.findByProvider(provider.id);
    return sendSuccess({ subscriptions });
  } catch (err) {
    return handleApiError(err);
  }
}

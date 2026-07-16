import { NextRequest } from 'next/server';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const provider = await providerRepository.findByUserId(user.id);
    if (!provider) return sendError('Provider profile not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const updated = await providerRepository.update(provider.id, {
      isAvailable: !provider.isAvailable,
    });

    return sendSuccess({ provider: updated }, `Provider is now ${updated.isAvailable ? 'available' : 'unavailable'}`);
  } catch (err) {
    return handleApiError(err);
  }
}

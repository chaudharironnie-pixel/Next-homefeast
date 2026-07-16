import { NextRequest } from 'next/server';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'admin');

    const providers = await providerRepository.findPending();
    return sendSuccess({ providers });
  } catch (err) {
    return handleApiError(err);
  }
}

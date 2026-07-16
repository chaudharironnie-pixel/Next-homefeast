import { NextRequest } from 'next/server';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { id } = await params;
    const provider = await providerRepository.findById(id);
    if (!provider) return sendError('Provider not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);
    return sendSuccess({ provider });
  } catch (err) {
    return handleApiError(err);
  }
}

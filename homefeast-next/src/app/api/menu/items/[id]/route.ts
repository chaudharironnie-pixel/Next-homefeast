import { NextRequest } from 'next/server';
import { menuRepository } from '@/server/repositories/menu.repository';
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
    const item = await menuRepository.update(id, provider.id, body);
    return sendSuccess({ item }, 'Menu item updated');
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    authorize(user, 'provider');

    const provider = await providerRepository.findByUserId(user.id);
    if (!provider) return sendError('Provider profile not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const { id } = await params;
    await menuRepository.softDelete(id, provider.id);
    return sendSuccess(null, 'Menu item deleted');
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from 'next/server';
import { addressRepository } from '@/server/repositories/address.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

type Context = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    const { id } = await params;
    const body = await request.json();

    const existing = await addressRepository.findById(id, user.id);
    if (!existing) return sendError('Address not found', 404, ErrorCodes.NOT_FOUND);

    const address = await addressRepository.update(id, user.id, body);
    return sendSuccess({ address }, 'Address updated');
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const user = await authenticate(request);
    const { id } = await params;

    const existing = await addressRepository.findById(id, user.id);
    if (!existing) return sendError('Address not found', 404, ErrorCodes.NOT_FOUND);

    await addressRepository.delete(id);
    return sendSuccess(null, 'Address deleted');
  } catch (err) {
    return handleApiError(err);
  }
}

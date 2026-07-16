import { NextRequest } from 'next/server';
import { addressRepository } from '@/server/repositories/address.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const addresses = await addressRepository.findByUser(user.id);
    return sendSuccess({ addresses });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const address = await addressRepository.create(user.id, body);
    return sendSuccess({ address }, 'Address created', 201);
  } catch (err) {
    return handleApiError(err);
  }
}

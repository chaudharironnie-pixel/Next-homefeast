import { NextRequest } from 'next/server';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';

const UPDATE_FIELDS = [
  'businessName', 'description', 'coverImage',
  'street', 'city', 'state', 'pincode',
  'deliveryRadius', 'minOrderAmount',
  'openTime', 'closeTime',
  'bankAccountHolder', 'bankAccountNumber', 'bankIfsc', 'upiId',
];

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const provider = await providerRepository.findOrCreateByUserId(user.id, user.name);
    return sendSuccess({ provider });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const updates: Record<string, unknown> = {};
    for (const key of UPDATE_FIELDS) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    const provider = await providerRepository.updateByUserId(user.id, updates);
    return sendSuccess({ provider }, 'Provider profile updated');
  } catch (err) {
    return handleApiError(err);
  }
}

import { NextRequest } from 'next/server';
import { menuRepository } from '@/server/repositories/menu.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'provider');

    const provider = await providerRepository.findOrCreateByUserId(user.id, user.name);
    if (!provider) return sendError('Provider profile not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const body = await request.json();
    const { name, description, price, mealType, isVeg, categoryId, cuisineId, preparationTime, calories, imageUrl } = body;

    const item = await menuRepository.create({
      providerId: provider.id,
      name,
      description,
      price,
      mealType,
      isVeg,
      categoryId,
      cuisineId,
      preparationTime,
      calories,
      imageUrl,
    });

    return sendSuccess({ item }, 'Menu item created', 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'provider');

    const provider = await providerRepository.findByUserId(user.id);
    if (!provider) return sendError('Provider profile not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const items = await menuRepository.findByProviderAll(provider.id);
    return sendSuccess({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

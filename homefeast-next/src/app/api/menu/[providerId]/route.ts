import { NextRequest } from 'next/server';
import { menuRepository } from '@/server/repositories/menu.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';

type Context = { params: Promise<{ providerId: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { providerId } = await params;
    const { searchParams } = new URL(_request.url);
    const mealType = searchParams.get('mealType') || undefined;
    const cuisine = searchParams.get('cuisine') || undefined;
    const isVeg = searchParams.get('isVeg');
    const minPrice = searchParams.get('minPrice') || undefined;
    const maxPrice = searchParams.get('maxPrice') || undefined;

    const items = await menuRepository.findByProvider(providerId, {
      mealType,
      cuisineId: cuisine,
      isVeg: isVeg !== null ? isVeg === 'true' : undefined,
      minPrice,
      maxPrice,
    });

    return sendSuccess({ items });
  } catch (err) {
    return handleApiError(err);
  }
}

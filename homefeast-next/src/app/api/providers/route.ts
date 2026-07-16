import { NextRequest } from 'next/server';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || undefined;
    const cuisine = searchParams.get('cuisine') || undefined;
    const rating = searchParams.get('rating') || undefined;
    const search = searchParams.get('search') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const skip = (page - 1) * limit;

    const [providers, total] = await providerRepository.findMany({
      city,
      cuisineId: cuisine,
      minRating: rating,
      search,
      skip,
      take: limit,
    });

    const pages = Math.ceil(total / limit);
    return sendSuccess({ providers, total, page, pages });
  } catch (err) {
    return handleApiError(err);
  }
}

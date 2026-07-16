import { NextRequest } from 'next/server';
import { mealPlanRepository } from '@/server/repositories/mealplan.repository';
import { sendSuccess } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';

type Context = { params: Promise<{ providerId: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  try {
    const { providerId } = await params;
    const plans = await mealPlanRepository.findByProvider(providerId);
    return sendSuccess({ plans });
  } catch (err) {
    return handleApiError(err);
  }
}

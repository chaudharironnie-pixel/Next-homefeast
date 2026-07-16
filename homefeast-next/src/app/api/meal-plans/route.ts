import { NextRequest } from 'next/server';
import { mealPlanRepository } from '@/server/repositories/mealplan.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate, authorize } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    if (providerId) {
      const plans = await mealPlanRepository.findByProvider(providerId);
      return sendSuccess({ plans });
    }
    const user = await authenticate(request);
    authorize(user, 'provider');
    const provider = await providerRepository.findByUserId(user.id);
    if (!provider) return sendError('Provider profile not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);
    const plans = await mealPlanRepository.findByProvider(provider.id);
    return sendSuccess({ plans });
  } catch (err) { return handleApiError(err); }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'provider');
    const provider = await providerRepository.findOrCreateByUserId(user.id, user.name);
    if (provider.status !== 'approved') return sendError('Provider account not yet approved', 403);
    const body = await request.json();
    const plan = await mealPlanRepository.create({
      providerId: provider.id,
      name: body.name,
      description: body.description,
      mealType: body.mealType,
      mealsPerDay: Number(body.mealsPerDay),
      daysPerWeek: Number(body.daysPerWeek),
      pricePerMonth: Number(body.pricePerMonth),
    });
    return sendSuccess({ plan }, 'Meal plan created', 201);
  } catch (err) { return handleApiError(err); }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'provider');
    const provider = await providerRepository.findOrCreateByUserId(user.id, user.name);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return sendError('Meal plan ID required', 400);
    const body = await request.json();
    const allowed: Record<string, unknown> = {};
    for (const key of ['name', 'description', 'mealType', 'mealsPerDay', 'daysPerWeek', 'pricePerMonth', 'isActive']) {
      if (body[key] !== undefined) allowed[key] = body[key];
    }
    const plan = await mealPlanRepository.update(id, provider.id, allowed);
    return sendSuccess({ plan });
  } catch (err) { return handleApiError(err); }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await authenticate(request);
    authorize(user, 'provider');
    const provider = await providerRepository.findOrCreateByUserId(user.id, user.name);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return sendError('Meal plan ID required', 400);
    await mealPlanRepository.softDelete(id, provider.id);
    return sendSuccess(null, 'Meal plan deleted');
  } catch (err) { return handleApiError(err); }
}

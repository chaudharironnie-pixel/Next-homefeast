import { NextRequest } from 'next/server';
import { subscriptionRepository } from '@/server/repositories/subscription.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { mealPlanRepository } from '@/server/repositories/mealplan.repository';
import { addressRepository } from '@/server/repositories/address.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import ErrorCodes from '@/server/utils/errorCodes';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const { providerId, mealPlanId, deliveryAddress, startDate, autoRenew } = body;

    if (!providerId || !mealPlanId || !startDate) {
      return sendError('providerId, mealPlanId, and startDate are required', 400, ErrorCodes.VALIDATION_FAILED);
    }

    const provider = await providerRepository.findById(providerId);
    if (!provider) return sendError('Provider not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);

    const mealPlan = await mealPlanRepository.findById(mealPlanId);
    if (!mealPlan) return sendError('Meal plan not found', 404, ErrorCodes.MEAL_PLAN_NOT_FOUND);

    let addressSnapshot: Record<string, unknown> = {};
    if (deliveryAddress?.addressId) {
      const addr = await addressRepository.findById(deliveryAddress.addressId, user.id);
      if (!addr) return sendError('Address not found', 404, ErrorCodes.NOT_FOUND);
      addressSnapshot = {
        addressId: addr.id,
        deliveryStreet: addr.street,
        deliveryCity: addr.city,
        deliveryState: addr.state,
        deliveryPincode: addr.pincode,
      };
    } else if (deliveryAddress?.street) {
      addressSnapshot = {
        deliveryStreet: deliveryAddress.street,
        deliveryCity: deliveryAddress.city,
        deliveryState: deliveryAddress.state,
        deliveryPincode: deliveryAddress.pincode,
      };
    }

    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);

    const subscription = await subscriptionRepository.create({
      customerId: user.id,
      providerId,
      mealPlanId,
      planName: mealPlan.name,
      mealType: mealPlan.mealType,
      mealsPerDay: mealPlan.mealsPerDay,
      daysPerWeek: mealPlan.daysPerWeek,
      pricePerMonth: mealPlan.pricePerMonth,
      startDate: start,
      endDate: end,
      autoRenew: autoRenew || false,
      ...addressSnapshot,
    });

    return sendSuccess({ subscription }, 'Subscription created', 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const subscriptions = await subscriptionRepository.findByCustomer(user.id);
    return sendSuccess({ subscriptions });
  } catch (err) {
    return handleApiError(err);
  }
}

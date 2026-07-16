import { NextRequest } from 'next/server';
import { orderRepository } from '@/server/repositories/order.repository';
import { providerRepository } from '@/server/repositories/provider.repository';
import { menuRepository } from '@/server/repositories/menu.repository';
import { couponRepository } from '@/server/repositories/coupon.repository';
import { sendSuccess, sendError } from '@/server/utils/response';
import { handleApiError } from '@/server/middleware/errorHandler';
import { authenticate } from '@/server/middleware/auth';
import { notifyOrderCreated } from '@/server/services/notification.service';
import { sendEmail, emailTemplates } from '@/server/utils/email';
import ErrorCodes from '@/server/utils/errorCodes';
import logger from '@/server/utils/logger';

const generateOrderNumber = () => {
  const date = new Date();
  const prefix = 'HF';
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${datePart}-${rand}`;
};

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const body = await request.json();
    const { providerId, items, deliveryAddress, couponCode, notes, paymentMethod } = body;

    if (!providerId || !items?.length) {
      return sendError('Provider and items are required', 400, ErrorCodes.VALIDATION_FAILED);
    }
    if (!deliveryAddress?.street || !deliveryAddress?.city || !deliveryAddress?.state || !deliveryAddress?.pincode) {
      return sendError('Complete delivery address is required', 400, ErrorCodes.VALIDATION_FAILED);
    }

    const provider = await providerRepository.findById(providerId);
    if (!provider) return sendError('Provider not found', 404, ErrorCodes.PROVIDER_NOT_FOUND);
    if (provider.status !== 'approved') return sendError('Provider is not approved', 400, ErrorCodes.PROVIDER_NOT_APPROVED);

    const menuItemIds = items.map((i: { menuItemId: string }) => i.menuItemId);
    const menuItems = await menuRepository.findManyByIds(menuItemIds);
    const menuMap = new Map(menuItems.map((m) => [m.id, m]));

    let subtotal = 0;
    const orderItems = items.map((item: { menuItemId: string; quantity: number }) => {
      const menuItem = menuMap.get(item.menuItemId);
      if (!menuItem) throw new Error(`Menu item ${item.menuItemId} not found`);
      const itemSubtotal = Number(menuItem.price) * item.quantity;
      subtotal += itemSubtotal;
      return {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        price: Number(menuItem.price),
        quantity: item.quantity,
        subtotal: itemSubtotal,
      };
    });

    const deliveryFee = Number(provider.deliveryRadius) > 0 ? 30 : 0;
    let discount = 0;
    let couponId = null;

    if (couponCode) {
      const result = await couponRepository.validate(couponCode, user.id, subtotal);
      if (result.valid) {
        discount = result.discount;
        couponId = result.coupon?.id || null;
      }
    }

    const total = Math.max(subtotal + deliveryFee - discount, 0);

    const order = await orderRepository.create({
      orderNumber: generateOrderNumber(),
      customerId: user.id,
      providerId,
      deliveryStreet: deliveryAddress.street,
      deliveryCity: deliveryAddress.city,
      deliveryState: deliveryAddress.state,
      deliveryPincode: deliveryAddress.pincode,
      subtotal,
      deliveryFee,
      discount,
      total,
      paymentMethod: paymentMethod || 'cod',
      couponId,
      notes: notes || null,
      items: { create: orderItems },
    });

    if (couponId) await couponRepository.incrementUsage(couponId);

    notifyOrderCreated(user.id, order.orderNumber).catch((e) =>
      logger.warn('Notification failed', { error: (e as Error).message })
    );

    sendEmail({
      to: user.email,
      subject: `HomeFeast - Order #${order.orderNumber} Confirmed`,
      html: emailTemplates.orderConfirmed(order as unknown as Record<string, unknown>, user.name),
    }).catch((e) => logger.warn('Email failed', { error: (e as Error).message }));

    return sendSuccess({ order }, 'Order placed successfully', 201);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const skip = (page - 1) * limit;

    const [orders, total] = await orderRepository.findByCustomer(user.id, { status, skip, take: limit });
    const pages = Math.ceil(total / limit);
    return sendSuccess({ orders, total, page, pages });
  } catch (err) {
    return handleApiError(err);
  }
}

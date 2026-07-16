import { notificationRepository } from '../repositories/notification.repository';

const createNotification = ({ recipientId, type, title, message, data }: {
  recipientId: string; type: string; title: string; message: string; data?: Record<string, unknown>;
}) => notificationRepository.create({ recipientId, type, title, message, data: data || {} });

export const notifyOrderCreated = (userId: string, orderNumber: string) =>
  createNotification({ recipientId: userId, type: 'order_created', title: 'Order Placed', message: `Your order #${orderNumber} has been placed successfully.`, data: { orderNumber } });

export const notifyOrderAccepted = (userId: string, orderNumber: string) =>
  createNotification({ recipientId: userId, type: 'order_accepted', title: 'Order Accepted', message: `Your order #${orderNumber} has been accepted by the provider.`, data: { orderNumber } });

export const notifyOrderRejected = (userId: string, orderNumber: string, reason: string) =>
  createNotification({ recipientId: userId, type: 'order_rejected', title: 'Order Rejected', message: `Your order #${orderNumber} was rejected. Reason: ${reason}`, data: { orderNumber, reason } });

export const notifySubscriptionExpiring = (userId: string, expiryDate: Date) =>
  createNotification({ recipientId: userId, type: 'subscription_expiring', title: 'Subscription Expiring Soon', message: `Your subscription expires on ${expiryDate.toLocaleDateString()}.`, data: { expiryDate: expiryDate.toISOString() } });

export const notifyNewReview = (providerUserId: string, customerName: string) =>
  createNotification({ recipientId: providerUserId, type: 'new_review', title: 'New Review', message: `${customerName} left a review on your profile.` });

export const notifyProviderApproved = (userId: string) =>
  createNotification({ recipientId: userId, type: 'provider_approved', title: 'Provider Account Approved', message: 'Congratulations! Your provider account has been approved. You can now start accepting orders.' });

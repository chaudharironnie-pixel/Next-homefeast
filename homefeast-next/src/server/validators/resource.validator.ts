import { z } from 'zod';

export const menuItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  price: z.coerce.number().min(0, 'Valid price required'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  categoryId: z.string().uuid('Valid category ID required'),
});

export const menuItemUpdateSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  price: z.coerce.number().min(0).optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  categoryId: z.string().uuid().optional(),
  isAvailable: z.coerce.boolean().optional(),
  description: z.string().max(1000).optional(),
});

export const orderSchema = z.object({
  provider: z.string().uuid('Valid provider ID required'),
  items: z.array(z.object({
    menuItem: z.string().uuid('Valid menu item ID required'),
    quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one item required'),
  deliveryAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    pincode: z.string().min(1, 'Pincode is required'),
  }),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5),
  order: z.string().uuid('Valid order ID required'),
  provider: z.string().uuid('Valid provider ID required'),
  comment: z.string().max(1000).optional(),
});

export const subscriptionSchema = z.object({
  providerId: z.string().uuid('Valid provider ID required'),
  mealPlanId: z.string().uuid('Valid meal plan ID required'),
  startDate: z.string().datetime('Valid start date required'),
  deliveryAddress: z.object({
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    pincode: z.string().min(1, 'Pincode is required'),
  }),
});

export const complaintSchema = z.object({
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  description: z.string().trim().min(1, 'Description is required').max(2000),
  category: z.enum(['food_quality', 'delivery', 'payment', 'provider', 'other']),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  image: z.string().url('Image must be a valid URL').optional(),
  sortOrder: z.coerce.number().int().min(0).optional(),
});

export const couponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required').max(50),
  type: z.enum(['percentage', 'fixed']),
  value: z.coerce.number().min(0, 'Coupon value must be positive'),
  minOrder: z.coerce.number().min(0).optional(),
  maxDiscount: z.coerce.number().min(0).optional(),
  startDate: z.string().datetime('Valid start date required'),
  endDate: z.string().datetime('Valid end date required'),
  usageLimit: z.coerce.number().int().min(1).optional(),
});

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, 'Coupon code is required'),
});

export const mealPlanSchema = z.object({
  name: z.string().trim().min(1, 'Meal plan name is required').max(100),
  description: z.string().max(1000).optional(),
  price: z.coerce.number().min(0, 'Valid price required'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  durationDays: z.coerce.number().int().min(1, 'Duration must be at least 1 day'),
  isActive: z.coerce.boolean().optional(),
});

export const addressSchema = z.object({
  street: z.string().trim().min(1, 'Street is required').max(200),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  pincode: z.string().trim().min(1, 'Pincode is required').max(20),
  label: z.enum(['home', 'work', 'other']).optional(),
  isDefault: z.coerce.boolean().optional(),
});

export const providerProfileUpdateSchema = z.object({
  businessName: z.string().trim().max(100).optional(),
  description: z.string().trim().max(2000).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().regex(/^\+?\d{10,15}$/, 'Invalid phone number format').optional(),
  deliveryRadius: z.coerce.number().min(0).max(50).optional(),
  minOrderAmount: z.coerce.number().min(0).optional(),
  deliveryFee: z.coerce.number().min(0).optional(),
});

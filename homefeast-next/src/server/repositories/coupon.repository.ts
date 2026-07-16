import { prisma } from '@/lib/prisma';

export const couponRepository = {
  findByCode: (code: string) =>
    prisma.coupon.findUnique({ where: { code: code.toUpperCase() } }),

  findAll: ({ skip = 0, take = 20 }: { skip?: number; take?: number } = {}) =>
    Promise.all([
      prisma.coupon.findMany({ orderBy: { createdAt: 'desc' }, skip, take }),
      prisma.coupon.count(),
    ]),

  create: (data: Record<string, unknown>) =>
    prisma.coupon.create({ data: { ...data, code: (data.code as string).toUpperCase() } } as never),

  update: (id: string, data: Record<string, unknown>) => prisma.coupon.update({ where: { id }, data }),

  incrementUsage: (id: string) =>
    prisma.coupon.update({ where: { id }, data: { usedCount: { increment: 1 } } }),

  validate: async (code: string, userId: string, orderAmount: number) => {
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (!coupon || !coupon.isActive) return { valid: false, message: 'Invalid coupon', discount: 0, coupon: null };
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) return { valid: false, message: 'Coupon expired', discount: 0, coupon: null };
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return { valid: false, message: 'Coupon usage limit reached', discount: 0, coupon: null };
    if (orderAmount < parseFloat(coupon.minOrderAmount)) {
      return { valid: false, message: `Minimum order ₹${coupon.minOrderAmount} required`, discount: 0, coupon: null };
    }
    let discount = coupon.type === 'percentage'
      ? (orderAmount * parseFloat(coupon.value)) / 100
      : parseFloat(coupon.value);
    if (coupon.maxDiscount) discount = Math.min(discount, parseFloat(coupon.maxDiscount));
    return { valid: true, coupon, discount };
  },
};

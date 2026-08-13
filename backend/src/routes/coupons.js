const router = require('express').Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/coupons — public list of active, non-expired, non-exhausted coupons
router.get('/', async (req, res) => {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { code: true, type: true, value: true, minOrder: true, maxDiscount: true, usageLimit: true, usedCount: true },
      orderBy: { value: 'desc' },
    });

    // Filter out usage-exhausted coupons and strip internal count fields
    const available = coupons
      .filter((c) => !c.usageLimit || c.usedCount < c.usageLimit)
      .map(({ usageLimit, usedCount, ...c }) => c);

    res.json(available);
  } catch {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /api/coupons/validate
router.post('/validate', authenticate, async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'coupon code is required' });
    }
    if (orderAmount === undefined || orderAmount === null) {
      return res.status(400).json({ error: 'orderAmount is required' });
    }
    const amount = parseFloat(orderAmount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ error: 'orderAmount must be a non-negative number' });
    }

    const coupon = await prisma.coupon.findFirst({
      where: { code: code.trim().toUpperCase(), isActive: true },
    });

    if (!coupon) return res.status(404).json({ error: 'Invalid coupon code' });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ error: 'Coupon has expired' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return res.status(400).json({ error: 'Coupon usage limit reached' });
    if (amount < coupon.minOrder) return res.status(400).json({ error: `Minimum order ₹${coupon.minOrder} required` });

    const discount = coupon.type === 'PERCENT'
      ? Math.min((amount * coupon.value) / 100, coupon.maxDiscount || Infinity)
      : coupon.value;

    res.json({ valid: true, discount: Math.round(discount), coupon });
  } catch {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

module.exports = router;

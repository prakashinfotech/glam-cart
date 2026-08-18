const router = require('express').Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { parseIntParam } = require('../utils/validate');
const { sendOrderConfirmation } = require('../utils/mailer');

const VALID_PAYMENT_METHODS = ['COD', 'UPI', 'CARD', 'NETBANKING'];

// GET /api/orders
router.get('/', authenticate, async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: { select: { name: true, images: true, slug: true } } } }, address: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid order ID' });

    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: { items: { include: { product: true } }, address: true },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders
router.post('/', authenticate, async (req, res) => {
  try {
    const { addressId, notes, couponCode, razorpayPaymentId } = req.body;
    const paymentMethod = req.body.paymentMethod || 'COD';

    if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ error: `paymentMethod must be one of: ${VALID_PAYMENT_METHODS.join(', ')}` });
    }

    // Validate addressId belongs to this user (prevents IDOR)
    if (addressId) {
      const aid = parseIntParam(addressId);
      if (!aid) return res.status(400).json({ error: 'Invalid addressId' });
      const address = await prisma.address.findFirst({ where: { id: aid, userId: req.user.id } });
      if (!address) return res.status(404).json({ error: 'Address not found' });
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: true },
    });

    if (cartItems.length === 0) return res.status(400).json({ error: 'Cart is empty' });

    // Check stock for all items before creating order
    const outOfStock = cartItems.filter((item) => item.product.stock < item.quantity);
    if (outOfStock.length > 0) {
      const names = outOfStock.map((i) => i.product.name).join(', ');
      return res.status(400).json({ error: `Insufficient stock for: ${names}` });
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const deliveryCharge = subtotal >= 499 ? 0 : 49;
    let discount = 0;

    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: { code: couponCode.toUpperCase(), isActive: true },
      });
      if (coupon && subtotal >= coupon.minOrder) {
        if (!coupon.expiresAt || coupon.expiresAt > new Date()) {
          if (!coupon.usageLimit || coupon.usedCount < coupon.usageLimit) {
            discount = coupon.type === 'PERCENT'
              ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
              : coupon.value;
          }
        }
      }
    }

    const total = Math.max(0, subtotal + deliveryCharge - discount);

    const order = await prisma.order.create({
      data: {
        userId: req.user.id,
        addressId: addressId ? parseIntParam(addressId) : null,
        status: 'CONFIRMED',
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? 'PENDING' : (razorpayPaymentId ? 'PAID' : 'PENDING'),
        notes: notes || (razorpayPaymentId ? `Razorpay Payment ID: ${razorpayPaymentId}` : undefined),
        subtotal,
        deliveryCharge,
        discount,
        total,
        items: {
          create: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product.price,
            shade: item.shade,
            size: item.size,
          })),
        },
      },
      include: { items: { include: { product: true } } },
    });

    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });

    // Send order confirmation email (non-blocking)
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { name: true, email: true },
    });
    sendOrderConfirmation(order, user);

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

module.exports = router;

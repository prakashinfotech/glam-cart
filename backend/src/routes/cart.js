const router = require('express').Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { parseIntParam } = require('../utils/validate');

// GET /api/cart
router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { brand: true, category: true } } },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /api/cart
router.post('/', authenticate, async (req, res) => {
  try {
    const { productId, shade, size } = req.body;
    const quantity = parseIntParam(req.body.quantity ?? 1);

    if (!productId) return res.status(400).json({ error: 'productId required' });
    const pid = parseIntParam(productId);
    if (!pid) return res.status(400).json({ error: 'productId must be a valid integer' });
    if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity must be at least 1' });

    const product = await prisma.product.findUnique({ where: { id: pid } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (!product.isActive) return res.status(400).json({ error: 'This product is no longer available' });
    if (product.stock < quantity) return res.status(400).json({ error: `Only ${product.stock} units available` });

    const item = await prisma.cartItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId: pid } },
      update: { quantity: { increment: quantity } },
      create: { userId: req.user.id, productId: pid, quantity, shade, size },
      include: { product: true },
    });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// PATCH /api/cart/:productId
router.patch('/:productId', authenticate, async (req, res) => {
  try {
    const productId = parseIntParam(req.params.productId);
    if (!productId) return res.status(400).json({ error: 'Invalid productId' });

    const quantity = parseIntParam(req.body.quantity);
    if (quantity === null) return res.status(400).json({ error: 'quantity must be a number' });

    if (quantity < 1) {
      await prisma.cartItem.delete({ where: { userId_productId: { userId: req.user.id, productId } } });
      return res.json({ message: 'Item removed' });
    }

    const item = await prisma.cartItem.update({
      where: { userId_productId: { userId: req.user.id, productId } },
      data: { quantity },
      include: { product: true },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// DELETE /api/cart/:productId
router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const productId = parseIntParam(req.params.productId);
    if (!productId) return res.status(400).json({ error: 'Invalid productId' });

    await prisma.cartItem.delete({
      where: { userId_productId: { userId: req.user.id, productId } },
    });
    res.json({ message: 'Removed from cart' });
  } catch {
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

// DELETE /api/cart (clear all)
router.delete('/', authenticate, async (req, res) => {
  try {
    await prisma.cartItem.deleteMany({ where: { userId: req.user.id } });
    res.json({ message: 'Cart cleared' });
  } catch {
    res.status(500).json({ error: 'Failed to clear cart' });
  }
});

module.exports = router;

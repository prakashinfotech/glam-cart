const router = require('express').Router();
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { brand: true } } },
      orderBy: { addedAt: 'desc' },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId required' });

    const item = await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user.id, productId } },
      update: {},
      create: { userId: req.user.id, productId },
      include: { product: true },
    });
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

router.delete('/:productId', authenticate, async (req, res) => {
  try {
    await prisma.wishlistItem.delete({
      where: { userId_productId: { userId: req.user.id, productId: parseInt(req.params.productId) } },
    });
    res.json({ message: 'Removed from wishlist' });
  } catch {
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

module.exports = router;

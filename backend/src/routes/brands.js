const router = require('express').Router();
const prisma = require('../db');

router.get('/', async (req, res) => {
  try {
    const brands = await prisma.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(brands);
  } catch {
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const brand = await prisma.brand.findUnique({
      where: { slug: req.params.slug },
      include: { products: { where: { isActive: true }, take: 20 } },
    });
    if (!brand) return res.status(404).json({ error: 'Brand not found' });
    res.json(brand);
  } catch {
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

module.exports = router;

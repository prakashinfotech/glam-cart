const router = require('express').Router();
const prisma = require('../db');
const { parseFloatParam } = require('../utils/validate');

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, sort, search, featured, bestseller, page = 1, limit = 20 } = req.query;

    const where = { isActive: true };
    if (category) where.category = { slug: category };
    if (brand) where.brand = { slug: brand };
    if (featured === 'true') where.isFeatured = true;
    if (bestseller === 'true') where.isBestSeller = true;
    const min = parseFloatParam(minPrice);
    const max = parseFloatParam(maxPrice);
    if (min !== null || max !== null) {
      where.price = {};
      if (min !== null) where.price.gte = min;
      if (max !== null) where.price.lte = max;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const orderBy = {};
    if (sort === 'price_asc') orderBy.price = 'asc';
    else if (sort === 'price_desc') orderBy.price = 'desc';
    else if (sort === 'rating') orderBy.rating = 'desc';
    else if (sort === 'newest') orderBy.createdAt = 'desc';
    else orderBy.isFeatured = 'desc';

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
        include: { category: { select: { name: true, slug: true } }, brand: { select: { name: true, slug: true } } },
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:slug
router.get('/:slug', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        category: true,
        brand: true,
        reviews: {
          include: { user: { select: { name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

module.exports = router;

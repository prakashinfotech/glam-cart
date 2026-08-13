const router = require('express').Router();
const prisma = require('../db');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
const { parseIntParam, parseFloatParam } = require('../utils/validate');

router.use(authenticate, authorizeAdmin);

const VALID_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// ─── Dashboard ────────────────────────────────────────────────────────────────

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [userCount, productCount, orderCount, revenueAgg, recentOrders] = await Promise.all([
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, email: true } } },
      }),
    ]);
    res.json({
      users: userCount,
      products: productCount,
      orders: orderCount,
      revenue: revenueAgg._sum.total || 0,
      recentOrders,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────

// GET /api/admin/products
router.get('/products', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);
    res.json({ products, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    const { name, slug, description, price, mrp, images, stock, categoryId, brandId, tags, isFeatured, isBestSeller, isActive } = req.body;
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ error: 'Product name, price and stock are required' });
    }
    if (!categoryId) return res.status(400).json({ error: 'Please select a category' });
    if (!brandId) return res.status(400).json({ error: 'Please select a brand' });

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);
    const parsedMrp = mrp ? parseFloat(mrp) : parsedPrice;

    if (isNaN(parsedPrice) || parsedPrice <= 0) return res.status(400).json({ error: 'Price must be greater than 0' });
    if (isNaN(parsedStock) || parsedStock < 0) return res.status(400).json({ error: 'Stock cannot be negative' });
    if (mrp && parsedMrp < parsedPrice) return res.status(400).json({ error: 'MRP cannot be less than selling price' });

    const productSlug = (slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existing = await prisma.product.findUnique({ where: { slug: productSlug } });
    if (existing) return res.status(409).json({ error: `A product named "${name}" already exists. Use a more specific name.` });

    const product = await prisma.product.create({
      data: {
        name,
        slug: productSlug,
        description: description || '',
        price: parsedPrice,
        mrp: parsedMrp,
        discount: mrp ? Math.round(((parsedMrp - parsedPrice) / parsedMrp) * 100) : 0,
        images: Array.isArray(images) ? images : [],
        stock: parsedStock,
        categoryId: parseInt(categoryId),
        brandId: parseInt(brandId),
        tags: tags || '',
        isFeatured: isFeatured || false,
        isBestSeller: isBestSeller || false,
        isActive: isActive !== false,
      },
      include: { category: true, brand: true },
    });
    res.status(201).json(product);
  } catch (err) {
    if (err.code === 'P2002') return res.status(409).json({ error: 'A product with this name already exists. Use a more specific name.' });
    if (err.code === 'P2025') return res.status(404).json({ error: 'Selected category or brand was not found' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid product ID' });

    const { name, slug, description, price, mrp, images, stock, categoryId, brandId, tags, isFeatured, isBestSeller, isActive } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (description !== undefined) data.description = description;
    if (price !== undefined) {
      const p = parseFloat(price);
      if (isNaN(p) || p <= 0) return res.status(400).json({ error: 'Price must be greater than 0' });
      data.price = p;
    }
    if (mrp !== undefined) {
      const m = parseFloat(mrp);
      const p = price !== undefined ? parseFloat(price) : undefined;
      if (p !== undefined && m < p) return res.status(400).json({ error: 'MRP cannot be less than price' });
      data.mrp = m;
      if (price !== undefined) data.discount = Math.round(((m - parseFloat(price)) / m) * 100);
    }
    if (images !== undefined) data.images = Array.isArray(images) ? images : [];
    if (stock !== undefined) {
      const s = parseInt(stock, 10);
      if (isNaN(s) || s < 0) return res.status(400).json({ error: 'Stock cannot be negative' });
      data.stock = s;
    }
    if (categoryId !== undefined) data.categoryId = categoryId ? parseInt(categoryId) : null;
    if (brandId !== undefined) data.brandId = brandId ? parseInt(brandId) : null;
    if (tags !== undefined) data.tags = tags;
    if (isFeatured !== undefined) data.isFeatured = isFeatured;
    if (isBestSeller !== undefined) data.isBestSeller = isBestSeller;
    if (isActive !== undefined) data.isActive = isActive;

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, brand: true },
    });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid product ID' });
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    res.json({ message: 'Product deactivated' });
  } catch {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────

// GET /api/admin/orders
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search, dateFrom, dateTo } = req.query;
    const where = {};
    if (status) where.status = status;
    if (search) {
      const orderId = parseInt(search);
      where.OR = [
        ...(Number.isFinite(orderId) ? [{ id: orderId }] : []),
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          address: true,
          items: { include: { product: { select: { name: true, images: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PATCH /api/admin/orders/:id
router.patch('/orders/:id', async (req, res) => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid order ID' });

    const { status, paymentStatus } = req.body;
    if (status && !VALID_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_ORDER_STATUSES.join(', ')}` });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { ...(status && { status }), ...(paymentStatus && { paymentStatus }) },
    });
    res.json(order);
  } catch {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ─── Coupons ──────────────────────────────────────────────────────────────────

// GET /api/admin/coupons
router.get('/coupons', async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coupons);
  } catch {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// POST /api/admin/coupons
router.post('/coupons', async (req, res) => {
  try {
    const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt, isActive } = req.body;
    if (!code || !type || value === undefined) {
      return res.status(400).json({ error: 'code, type and value are required' });
    }
    if (!['PERCENT', 'FLAT'].includes(type)) {
      return res.status(400).json({ error: 'type must be PERCENT or FLAT' });
    }

    const existing = await prisma.coupon.findFirst({ where: { code: code.trim().toUpperCase() } });
    if (existing) return res.status(409).json({ error: 'Coupon code already exists' });

    const coupon = await prisma.coupon.create({
      data: {
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value),
        minOrder: minOrder ? parseFloat(minOrder) : 0,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== false,
      },
    });
    res.status(201).json(coupon);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create coupon' });
  }
});

// PATCH /api/admin/coupons/:id
router.patch('/coupons/:id', async (req, res) => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid coupon ID' });
    const { code, type, value, minOrder, maxDiscount, usageLimit, expiresAt, isActive } = req.body;
    const data = {};
    if (code !== undefined) data.code = code.trim().toUpperCase();
    if (type !== undefined) {
      if (!['PERCENT', 'FLAT'].includes(type)) return res.status(400).json({ error: 'type must be PERCENT or FLAT' });
      data.type = type;
    }
    if (value !== undefined) data.value = parseFloat(value);
    if (minOrder !== undefined) data.minOrder = parseFloat(minOrder);
    if (maxDiscount !== undefined) data.maxDiscount = maxDiscount ? parseFloat(maxDiscount) : null;
    if (usageLimit !== undefined) data.usageLimit = usageLimit ? parseInt(usageLimit) : null;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (isActive !== undefined) data.isActive = isActive;
    const coupon = await prisma.coupon.update({ where: { id }, data });
    res.json(coupon);
  } catch {
    res.status(500).json({ error: 'Failed to update coupon' });
  }
});

// DELETE /api/admin/coupons/:id
router.delete('/coupons/:id', async (req, res) => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid coupon ID' });
    await prisma.coupon.delete({ where: { id } });
    res.json({ message: 'Coupon deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search
      ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, phone: true,
          role: true, createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ users, total });
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PATCH /api/admin/users/:id/role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid user ID' });
    const { role } = req.body;
    if (!['USER', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'role must be USER or ADMIN' });
    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;

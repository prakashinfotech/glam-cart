const router = require('express').Router();
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { validatePassword, validatePhone, validatePincode, parseIntParam } = require('../utils/validate');

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, phone: true, avatar: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PATCH /api/users/profile
router.patch('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    if (name !== undefined && name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }
    if (phone) {
      const phoneErr = validatePhone(phone);
      if (phoneErr) return res.status(400).json({ error: phoneErr });
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, avatar },
      select: { id: true, email: true, name: true, phone: true, avatar: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/users/change-password
router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const passwordErr = validatePassword(newPassword);
    if (passwordErr) return res.status(400).json({ error: passwordErr });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });
    res.json({ message: 'Password updated successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// GET /api/users/addresses
router.get('/addresses', authenticate, async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({ where: { userId: req.user.id } });
    res.json(addresses);
  } catch {
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
});

// POST /api/users/addresses
router.post('/addresses', authenticate, async (req, res) => {
  try {
    const { type, name, phone, line1, line2, city, state, pincode, isDefault } = req.body;
    if (!name || !phone || !line1 || !city || !state || !pincode) {
      return res.status(400).json({ error: 'Name, phone, address line 1, city, state and pincode are required' });
    }
    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters' });
    }

    const phoneErr = validatePhone(phone);
    if (phoneErr) return res.status(400).json({ error: phoneErr });

    const pincodeErr = validatePincode(pincode);
    if (pincodeErr) return res.status(400).json({ error: pincodeErr });

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { isDefault: false } });
    }
    const address = await prisma.address.create({
      data: { userId: req.user.id, type, name, phone, line1, line2, city, state, pincode, isDefault: isDefault || false },
    });
    res.status(201).json(address);
  } catch {
    res.status(500).json({ error: 'Failed to add address' });
  }
});

// DELETE /api/users/addresses/:id
router.delete('/addresses/:id', authenticate, async (req, res) => {
  try {
    const id = parseIntParam(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid address ID' });
    await prisma.address.deleteMany({ where: { id, userId: req.user.id } });
    res.json({ message: 'Address deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete address' });
  }
});

module.exports = router;

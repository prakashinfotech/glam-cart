const router = require('express').Router()
const Razorpay = require('razorpay')
const crypto = require('crypto')
const { authenticate } = require('../middleware/auth')

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
})

// POST /api/payments/create-order
router.post('/create-order', authenticate, async (req, res) => {
  try {
    const { amount } = req.body
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' })

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    })

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create payment order' })
  }
})

// POST /api/payments/verify
router.post('/verify', authenticate, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex')
    res.json({ valid: expectedSignature === razorpay_signature })
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' })
  }
})

module.exports = router

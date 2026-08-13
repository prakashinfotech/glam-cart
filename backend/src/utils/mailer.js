const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const orderConfirmationTemplate = (order, user) => {
  const items = order.items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
        <strong style="color:#1a1a1a;">${item.product.name}</strong>
        ${item.shade ? `<span style="color:#888;font-size:13px;"> — ${item.shade}</span>` : ''}
        ${item.size ? `<span style="color:#888;font-size:13px;"> / ${item.size}</span>` : ''}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:center;color:#555;">×${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;color:#1a1a1a;">
        ₹${(item.price * item.quantity).toLocaleString('en-IN')}
      </td>
    </tr>
  `).join('');

  const address = order.address
    ? `${order.address.line1}${order.address.line2 ? ', ' + order.address.line2 : ''}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`
    : 'Not specified';

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <tr>
          <td style="background:#fc2779;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">GlamCart</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Beauty & Wellness Shopping</p>
          </td>
        </tr>

        <!-- Success Banner -->
        <tr>
          <td style="background:#fff8fb;padding:28px 40px;border-bottom:1px solid #ffe0ef;text-align:center;">
            <div style="font-size:40px;margin-bottom:10px;">🎉</div>
            <h2 style="margin:0;color:#fc2779;font-size:22px;">Order Confirmed!</h2>
            <p style="margin:8px 0 0;color:#555;font-size:15px;">
              Hi <strong>${user.name || user.email}</strong>, your order has been placed successfully.
            </p>
          </td>
        </tr>

        <!-- Order Info -->
        <tr>
          <td style="padding:28px 40px 0;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#f9f9f9;border-radius:10px;padding:16px 20px;">
                  <table width="100%">
                    <tr>
                      <td style="color:#888;font-size:13px;">Order ID</td>
                      <td style="color:#1a1a1a;font-weight:700;text-align:right;font-size:15px;">#${order.id}</td>
                    </tr>
                    <tr>
                      <td style="color:#888;font-size:13px;padding-top:8px;">Date</td>
                      <td style="color:#1a1a1a;text-align:right;font-size:13px;padding-top:8px;">
                        ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </td>
                    </tr>
                    <tr>
                      <td style="color:#888;font-size:13px;padding-top:8px;">Payment</td>
                      <td style="color:#1a1a1a;text-align:right;font-size:13px;padding-top:8px;">${order.paymentMethod}</td>
                    </tr>
                    <tr>
                      <td style="color:#888;font-size:13px;padding-top:8px;">Deliver to</td>
                      <td style="color:#1a1a1a;text-align:right;font-size:13px;padding-top:8px;max-width:260px;">${address}</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Items -->
        <tr>
          <td style="padding:24px 40px 0;">
            <h3 style="margin:0 0 12px;color:#1a1a1a;font-size:16px;">Order Items</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
              <thead>
                <tr>
                  <th style="text-align:left;color:#888;font-size:12px;font-weight:600;padding-bottom:8px;text-transform:uppercase;">Product</th>
                  <th style="text-align:center;color:#888;font-size:12px;font-weight:600;padding-bottom:8px;text-transform:uppercase;">Qty</th>
                  <th style="text-align:right;color:#888;font-size:12px;font-weight:600;padding-bottom:8px;text-transform:uppercase;">Amount</th>
                </tr>
              </thead>
              <tbody>${items}</tbody>
            </table>
          </td>
        </tr>

        <!-- Totals -->
        <tr>
          <td style="padding:16px 40px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#888;font-size:14px;padding:4px 0;">Subtotal</td>
                <td style="text-align:right;color:#555;font-size:14px;padding:4px 0;">₹${Number(order.subtotal).toLocaleString('en-IN')}</td>
              </tr>
              ${order.discount > 0 ? `
              <tr>
                <td style="color:#22c55e;font-size:14px;padding:4px 0;">Discount</td>
                <td style="text-align:right;color:#22c55e;font-size:14px;padding:4px 0;">−₹${Number(order.discount).toLocaleString('en-IN')}</td>
              </tr>` : ''}
              <tr>
                <td style="color:#888;font-size:14px;padding:4px 0;">Delivery</td>
                <td style="text-align:right;color:#555;font-size:14px;padding:4px 0;">
                  ${order.deliveryCharge === 0 ? '<span style="color:#22c55e;">FREE</span>' : `₹${order.deliveryCharge}`}
                </td>
              </tr>
              <tr>
                <td style="border-top:2px solid #f0f0f0;padding-top:10px;font-weight:800;font-size:16px;color:#1a1a1a;">Total</td>
                <td style="border-top:2px solid #f0f0f0;padding-top:10px;text-align:right;font-weight:800;font-size:18px;color:#fc2779;">
                  ₹${Number(order.total).toLocaleString('en-IN')}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#888;font-size:13px;">
              Thank you for shopping with <strong style="color:#fc2779;">GlamCart</strong>! 💄
            </p>
            <p style="margin:6px 0 0;color:#bbb;font-size:12px;">
              This is an automated email. Please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

const sendOrderConfirmation = async (order, user) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: `Order Confirmed #${order.id} — GlamCart`,
      html: orderConfirmationTemplate(order, user),
    });
    console.log(`\x1b[32mEmail sent\x1b[0m → ${user.email} (Order #${order.id})`);
  } catch (err) {
    console.error(`\x1b[31mEmail failed\x1b[0m for Order #${order.id}:`, err.message);
  }
};

const passwordResetTemplate = (user, resetUrl) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <tr>
          <td style="background:#fc2779;padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">GlamCart</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">Beauty & Wellness Shopping</p>
          </td>
        </tr>

        <tr>
          <td style="padding:40px;text-align:center;">
            <div style="width:64px;height:64px;background:#fff0f6;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:20px;">
              <span style="font-size:32px;">🔐</span>
            </div>
            <h2 style="margin:0 0 10px;color:#1a1a1a;font-size:22px;">Reset Your Password</h2>
            <p style="margin:0 0 8px;color:#555;font-size:15px;">
              Hi <strong>${user.name || user.email}</strong>, we received a request to reset your password.
            </p>
            <p style="margin:0 0 32px;color:#888;font-size:14px;">
              This link expires in <strong>1 hour</strong>. If you didn't request this, you can safely ignore this email.
            </p>
            <a href="${resetUrl}" style="display:inline-block;background:#fc2779;color:#fff;font-size:16px;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;letter-spacing:0.2px;">
              Reset Password
            </a>
            <p style="margin:28px 0 8px;color:#555;font-size:14px;">
              <strong>Using the mobile app?</strong> Copy the token below:
            </p>
            <div style="background:#fff0f6;border:1.5px dashed #fc2779;border-radius:10px;padding:14px 20px;word-break:break-all;">
              <p style="margin:0 0 4px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Reset Token</p>
              <code style="color:#fc2779;font-size:14px;font-weight:700;letter-spacing:0.5px;">${resetUrl.split('?token=')[1]}</code>
            </div>
            <p style="margin:16px 0 0;color:#bbb;font-size:12px;">
              Token expires in <strong>1 hour</strong>.
            </p>
          </td>
        </tr>

        <tr>
          <td style="background:#f9f9f9;padding:24px 40px;text-align:center;border-top:1px solid #f0f0f0;">
            <p style="margin:0;color:#bbb;font-size:12px;">
              This is an automated email from <strong style="color:#fc2779;">GlamCart</strong>. Please do not reply.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

const sendPasswordReset = async (user, resetUrl) => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: 'Reset your GlamCart password',
      html: passwordResetTemplate(user, resetUrl),
    });
    console.log(`\x1b[32mPassword reset email sent\x1b[0m → ${user.email}`);
  } catch (err) {
    console.error(`\x1b[31mPassword reset email failed\x1b[0m for ${user.email}:`, err.message);
  }
};

module.exports = { sendOrderConfirmation, sendPasswordReset };

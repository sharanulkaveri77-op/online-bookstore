const express = require('express');
const path = require('path');
const { db } = require(path.join(__dirname, '..', 'db', 'database'));
const { authRequired } = require(path.join(__dirname, '..', 'middleware', 'auth'));
const { notify } = require(path.join(__dirname, '..', 'utils', 'notifier'));
const { buildInvoicePDF } = require(path.join(__dirname, '..', 'utils', 'invoice'));

const router = express.Router();

const LOW_STOCK_THRESHOLD = 5;

function validateCoupon(code) {
  const coupon = db.prepare('SELECT * FROM coupons WHERE code = ?').get(String(code).trim().toUpperCase());
  if (!coupon || !coupon.active) {
    return { error: 'Invalid coupon code' };
  }
  if (new Date(coupon.valid_until) < new Date()) {
    return { error: 'This coupon has expired' };
  }
  return { coupon };
}

router.use(authRequired);

router.post('/validate-coupon', (req, res) => {
  if (!req.body.coupon_code || !String(req.body.coupon_code).trim()) {
    return res.status(400).json({ error: 'Coupon code is required' });
  }
  const result = validateCoupon(req.body.coupon_code);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  const { code, discount_percent, valid_until } = result.coupon;
  res.json({ coupon: { code, discount_percent, valid_until } });
});

const ORDER_ITEM_SELECT = `
  SELECT oi.id, oi.quantity, oi.price_at_purchase,
         b.id AS book_id, b.title, b.cover_image_url, a.name AS author_name
  FROM order_items oi
  JOIN books b ON b.id = oi.book_id
  JOIN authors a ON a.id = b.author_id
  WHERE oi.order_id = ?
`;

router.post('/', (req, res) => {
  const cartItems = db.prepare(
    `SELECT ci.book_id, ci.quantity, b.title, b.price, b.stock_qty
     FROM cart_items ci JOIN books b ON b.id = ci.book_id WHERE ci.user_id = ?`
  ).all(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Your cart is empty' });
  }

  let coupon = null;
  if (req.body.coupon_code) {
    const result = validateCoupon(req.body.coupon_code);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    coupon = result.coupon;
  }

  for (const item of cartItems) {
    if (item.quantity > item.stock_qty) {
      return res.status(400).json({
        error: `"${item.title}" has only ${item.stock_qty} copies in stock. Please adjust your cart.`
      });
    }
  }

  const subtotal = cartItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const discount = coupon ? Math.round(subtotal * coupon.discount_percent) / 100 : 0;
  const total = Math.round((subtotal - discount) * 100) / 100;

  const placeOrder = db.transaction(() => {
    const orderId = db
      .prepare('INSERT INTO orders (user_id, total_amount, discount_amount, coupon_code, status) VALUES (?, ?, ?, ?, ?)')
      .run(req.user.id, total, discount, coupon ? coupon.code : null, 'pending').lastInsertRowid;

    const insertItem = db.prepare('INSERT INTO order_items (order_id, book_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)');
    const decrementStock = db.prepare('UPDATE books SET stock_qty = stock_qty - ? WHERE id = ?');

    for (const item of cartItems) {
      insertItem.run(orderId, item.book_id, item.quantity, item.price);
      decrementStock.run(item.quantity, item.book_id);
      const newStock = item.stock_qty - item.quantity;
      if (newStock < LOW_STOCK_THRESHOLD) {
        notify('low_stock', `Low stock alert: "${item.title}" has only ${newStock} unit(s) left`);
      }
    }

    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
    return orderId;
  });

  const orderId = placeOrder();
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  const items = db.prepare(ORDER_ITEM_SELECT).all(orderId);
  res.status(201).json({
    order,
    items,
    subtotal: Math.round(subtotal * 100) / 100,
    discount,
    message: 'Order placed successfully'
  });
});

router.get('/', (req, res) => {
  const orders = db.prepare(
    `SELECT o.id, o.status, o.total_amount, o.discount_amount, o.coupon_code, o.created_at,
            COUNT(oi.id) AS item_count, SUM(oi.quantity) AS unit_count
     FROM orders o LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.user_id = ?
     GROUP BY o.id ORDER BY o.created_at DESC`
  ).all(req.user.id);
  res.json({ orders });
});

router.get('/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'You can only view your own orders' });
  }
  const items = db.prepare(ORDER_ITEM_SELECT).all(order.id);
  const subtotal = items.reduce((s, it) => s + it.quantity * it.price_at_purchase, 0);
  res.json({ order, items, subtotal: Math.round(subtotal * 100) / 100 });
});

router.get('/:id/invoice', async (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  if (order.user_id !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const items = db.prepare(ORDER_ITEM_SELECT).all(order.id);
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(order.user_id);
  try {
    const pdf = await buildInvoicePDF(order, items, user);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${order.id}.pdf"`);
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: 'Could not generate invoice' });
  }
});

module.exports = router;

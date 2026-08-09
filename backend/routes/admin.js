const express = require('express');
const { db } = require('../db/database');
const { authRequired, requireRole } = require('../middleware/auth');
const { makeValidator } = require('../middleware/validate');
const { getAlerts } = require('../utils/notifier');

const router = express.Router();
router.use(authRequired);
router.use(requireRole('admin'));

router.get('/stats', (req, res) => {
  const revenue = db.prepare(
    `SELECT COALESCE(SUM(total_amount), 0) AS total FROM orders WHERE status != 'cancelled'`
  ).get();
  const orders = db.prepare(`SELECT COUNT(*) AS n FROM orders`).get();
  const customers = db.prepare(`SELECT COUNT(*) AS n FROM users WHERE role = 'customer'`).get();
  const books = db.prepare(`SELECT COUNT(*) AS n FROM books`).get();
  const lowStock = db.prepare(
    `SELECT b.id, b.title, b.stock_qty, b.price, b.cover_image_url, c.name AS category_name
     FROM books b JOIN categories c ON c.id = b.category_id
     WHERE b.stock_qty < 5 ORDER BY b.stock_qty ASC`
  ).all();
  const topBooks = db.prepare(
    `SELECT b.id, b.title, b.price, b.cover_image_url, a.name AS author_name,
            COALESCE(SUM(oi.quantity), 0) AS units_sold
     FROM books b
     JOIN authors a ON a.id = b.author_id
     LEFT JOIN order_items oi ON oi.book_id = b.id
     GROUP BY b.id
     ORDER BY units_sold DESC, b.title ASC
     LIMIT 5`
  ).all();
  const recentOrders = db.prepare(
    `SELECT o.id, o.status, o.total_amount, o.created_at, u.name AS customer_name
     FROM orders o JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC LIMIT 5`
  ).all();
  const ordersByStatus = db.prepare(
    `SELECT status, COUNT(*) AS n FROM orders GROUP BY status`
  ).all();

  res.json({
    revenue: Math.round(revenue.total * 100) / 100,
    total_orders: orders.n,
    total_customers: customers.n,
    total_books: books.n,
    low_stock_books: lowStock,
    low_stock_count: lowStock.length,
    top_books: topBooks,
    recent_orders: recentOrders,
    orders_by_status: ordersByStatus,
    alerts: getAlerts()
  });
});

const bookRules = {
  title: { required: true, type: 'string', min: 2, message: 'Title must be at least 2 characters' },
  author_id: { required: true, type: 'int', min: 1, message: 'Author is required' },
  publisher_id: { required: true, type: 'int', min: 1, message: 'Publisher is required' },
  category_id: { required: true, type: 'int', min: 1, message: 'Category is required' },
  isbn: { required: true, type: 'string', min: 4, message: 'ISBN must be at least 4 characters' },
  price: { required: true, type: 'number', min: 0, message: 'Price must be a positive number' },
  stock_qty: { required: true, type: 'int', min: 0, message: 'Stock must be a non-negative whole number' }
};

function validRefs(req, res) {
  const author = db.prepare('SELECT id FROM authors WHERE id = ?').get(req.body.author_id);
  const publisher = db.prepare('SELECT id FROM publishers WHERE id = ?').get(req.body.publisher_id);
  const category = db.prepare('SELECT id FROM categories WHERE id = ?').get(req.body.category_id);
  if (!author || !publisher || !category) {
    res.status(400).json({ error: 'Invalid author, publisher or category reference' });
    return false;
  }
  return true;
}

router.get('/books', (req, res) => {
  const books = db.prepare(
    `SELECT b.id, b.title, b.isbn, b.price, b.stock_qty, b.cover_image_url,
            a.name AS author_name, p.name AS publisher_name, c.name AS category_name
     FROM books b
     JOIN authors a ON a.id = b.author_id
     JOIN publishers p ON p.id = b.publisher_id
     JOIN categories c ON c.id = b.category_id
     ORDER BY b.id DESC`
  ).all();
  res.json({ books });
});

router.post('/books', makeValidator(bookRules), (req, res) => {
  if (!validRefs(req, res)) return;
  const { title, author_id, publisher_id, category_id, isbn, price, stock_qty, description, cover_image_url, sample_pdf_url } = req.body;
  const id = db.prepare(
    `INSERT INTO books (title, author_id, publisher_id, category_id, isbn, price, stock_qty, description, cover_image_url, sample_pdf_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(title.trim(), author_id, publisher_id, category_id, isbn.trim(), Number(price), Number(stock_qty), description || null, cover_image_url || null, sample_pdf_url || null).lastInsertRowid;
  res.status(201).json({ message: 'Book created', id });
});

router.put('/books/:id', makeValidator(bookRules), (req, res) => {
  if (!validRefs(req, res)) return;
  const { title, author_id, publisher_id, category_id, isbn, price, stock_qty, description, cover_image_url, sample_pdf_url } = req.body;
  const result = db.prepare(
    `UPDATE books SET title = ?, author_id = ?, publisher_id = ?, category_id = ?, isbn = ?, price = ?, stock_qty = ?, description = ?, cover_image_url = ?, sample_pdf_url = ? WHERE id = ?`
  ).run(title.trim(), author_id, publisher_id, category_id, isbn.trim(), Number(price), Number(stock_qty), description || null, cover_image_url || null, sample_pdf_url || null, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Book not found' });
  }
  res.json({ message: 'Book updated' });
});

router.delete('/books/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ message: 'Book deleted' });
  } catch {
    res.status(409).json({ error: 'Cannot delete this book - it is referenced by orders or reviews' });
  }
});

const simpleRules = {
  name: { required: true, type: 'string', min: 2, message: 'Name must be at least 2 characters' }
};

function makeCrud(resource, table, extra) {
  const listStmt = db.prepare(`SELECT * FROM ${table} ORDER BY name`);
  const insertStmt = extra
    ? db.prepare(`INSERT INTO ${table} (name, bio) VALUES (?, ?)`)
    : db.prepare(`INSERT INTO ${table} (name) VALUES (?)`);
  const updateStmt = extra
    ? db.prepare(`UPDATE ${table} SET name = ?, bio = ? WHERE id = ?`)
    : db.prepare(`UPDATE ${table} SET name = ? WHERE id = ?`);
  const deleteStmt = db.prepare(`DELETE FROM ${table} WHERE id = ?`);

  router.get(`/${resource}`, (req, res) => res.json({ items: listStmt.all() }));

  router.post(`/${resource}`, makeValidator(simpleRules), (req, res) => {
    try {
      const id = extra
        ? insertStmt.run(req.body.name.trim(), req.body.bio || null).lastInsertRowid
        : insertStmt.run(req.body.name.trim()).lastInsertRowid;
      res.status(201).json({ message: `${resource} created`, id });
    } catch {
      res.status(409).json({ error: `${resource} with this name already exists` });
    }
  });

  router.put(`/${resource}/:id`, makeValidator(simpleRules), (req, res) => {
    const result = extra
      ? updateStmt.run(req.body.name.trim(), req.body.bio || null, req.params.id)
      : updateStmt.run(req.body.name.trim(), req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: `${resource} not found` });
    }
    res.json({ message: `${resource} updated` });
  });

  router.delete(`/${resource}/:id`, (req, res) => {
    try {
      const result = deleteStmt.run(req.params.id);
      if (result.changes === 0) {
        return res.status(404).json({ error: `${resource} not found` });
      }
      res.json({ message: `${resource} deleted` });
    } catch {
      res.status(409).json({ error: `Cannot delete this ${resource} - it is referenced by books` });
    }
  });
}

makeCrud('categories', 'categories', false);
makeCrud('publishers', 'publishers', false);
makeCrud('authors', 'authors', true);

router.get('/coupons', (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons ORDER BY id DESC').all();
  res.json({ coupons });
});

router.post(
  '/coupons',
  makeValidator({
    code: { required: true, type: 'string', min: 3, message: 'Coupon code must be at least 3 characters' },
    discount_percent: { required: true, type: 'int', min: 1, message: 'Discount must be between 1 and 100' },
    valid_until: { required: true, type: 'string', min: 8, message: 'Valid-until date is required' }
  }),
  (req, res) => {
    if (req.body.discount_percent > 100) {
      return res.status(400).json({ error: 'Discount cannot exceed 100%' });
    }
    try {
      const id = db.prepare('INSERT INTO coupons (code, discount_percent, valid_until, active) VALUES (?, ?, ?, ?)')
        .run(String(req.body.code).trim().toUpperCase(), Number(req.body.discount_percent), req.body.valid_until, req.body.active === undefined ? 1 : Number(req.body.active)).lastInsertRowid;
      res.status(201).json({ message: 'Coupon created', id });
    } catch {
      res.status(409).json({ error: 'A coupon with this code already exists' });
    }
  }
);

router.put('/coupons/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM coupons WHERE id = ?').get(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Coupon not found' });
  }
  const { code, discount_percent, valid_until, active } = req.body;
  db.prepare('UPDATE coupons SET code = ?, discount_percent = ?, valid_until = ?, active = ? WHERE id = ?')
    .run(
      code !== undefined ? String(code).trim().toUpperCase() : existing.code,
      discount_percent !== undefined ? Number(discount_percent) : existing.discount_percent,
      valid_until || existing.valid_until,
      active !== undefined ? Number(active) : existing.active,
      req.params.id
    );
  res.json({ message: 'Coupon updated' });
});

router.delete('/coupons/:id', (req, res) => {
  const result = db.prepare('DELETE FROM coupons WHERE id = ?').run(req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Coupon not found' });
  }
  res.json({ message: 'Coupon deleted' });
});

router.get('/orders', (req, res) => {
  const orders = db.prepare(
    `SELECT o.id, o.status, o.total_amount, o.discount_amount, o.coupon_code, o.created_at,
            u.name AS customer_name, u.email AS customer_email,
            COUNT(oi.id) AS item_count
     FROM orders o
     JOIN users u ON u.id = o.user_id
     LEFT JOIN order_items oi ON oi.order_id = o.id
     GROUP BY o.id
     ORDER BY o.created_at DESC`
  ).all();
  res.json({ orders });
});

router.get('/orders/:id', (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  const items = db.prepare(
    `SELECT oi.quantity, oi.price_at_purchase, b.title, b.cover_image_url
     FROM order_items oi JOIN books b ON b.id = oi.book_id WHERE oi.order_id = ?`
  ).all(order.id);
  const user = db.prepare('SELECT name, email FROM users WHERE id = ?').get(order.user_id);
  res.json({ order, items, user });
});

router.put('/orders/:id/status', (req, res) => {
  const statuses = ['pending', 'shipped', 'delivered', 'cancelled'];
  if (!statuses.includes(req.body.status)) {
    return res.status(400).json({ error: `Status must be one of: ${statuses.join(', ')}` });
  }
  const result = db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json({ message: `Order marked as ${req.body.status}` });
});

module.exports = router;

const express = require('express');
const jwt = require('jsonwebtoken');
const { db } = require('../db/database');
const { authRequired } = require('../middleware/auth');
const { makeValidator } = require('../middleware/validate');
const { fuzzySearch } = require('../utils/levenshtein');

const router = express.Router();

const BOOK_SELECT = `
  SELECT b.id, b.title, b.isbn, b.price, b.stock_qty, b.description,
         b.cover_image_url, b.sample_pdf_url,
         a.id AS author_id, a.name AS author_name,
         p.name AS publisher_name,
         c.id AS category_id, c.name AS category_name,
         ROUND(AVG(r.rating), 1) AS avg_rating,
         COUNT(DISTINCT r.id) AS review_count,
         (SELECT COALESCE(SUM(oi.quantity), 0) FROM order_items oi WHERE oi.book_id = b.id) AS units_sold
  FROM books b
  JOIN authors a ON a.id = b.author_id
  JOIN publishers p ON p.id = b.publisher_id
  JOIN categories c ON c.id = b.category_id
  LEFT JOIN reviews r ON r.book_id = b.id
`;

const BOOK_GROUP = `
  GROUP BY b.id
`;

const SORTS = {
  popular: 'units_sold DESC',
  rating_desc: 'avg_rating DESC NULLS LAST, units_sold DESC',
  price_asc: 'b.price ASC',
  price_desc: 'b.price DESC',
  newest: 'b.created_at DESC',
  title_asc: 'b.title ASC'
};

function tryOptionalAuth(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(payload.id) || null;
  } catch {
    return null;
  }
}

router.get('/', (req, res) => {
  const { q, category, author, publisher, minPrice, maxPrice, inStock, sort } = req.query;
  const where = [];
  const params = [];

  if (category) { where.push('b.category_id = ?'); params.push(category); }
  if (author) { where.push('b.author_id = ?'); params.push(author); }
  if (publisher) { where.push('b.publisher_id = ?'); params.push(publisher); }
  if (minPrice !== undefined && minPrice !== '') { where.push('b.price >= ?'); params.push(Number(minPrice)); }
  if (maxPrice !== undefined && maxPrice !== '') { where.push('b.price <= ?'); params.push(Number(maxPrice)); }
  if (inStock === '1' || inStock === 'true') { where.push('b.stock_qty > 0'); }

  let searchMode = false;
  if (q && String(q).trim()) {
    const term = `%${String(q).trim()}%`;
    where.push('(b.title LIKE ? OR a.name LIKE ? OR b.isbn LIKE ?)');
    params.push(term, term, term);
    searchMode = true;
  }

  const orderBy = SORTS[sort] || SORTS.popular;
  const sql = `${BOOK_SELECT} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ${BOOK_GROUP} ORDER BY ${orderBy}`;
  let rows = db.prepare(sql).all(...params);

  let fuzzyUsed = false;
  if (searchMode && rows.length < 5 && String(q).trim().length >= 3) {
    const allBooks = db.prepare(`${BOOK_SELECT} ${BOOK_GROUP}`).all();
    const fuzzyMatches = fuzzySearch(allBooks, String(q));
    const existing = new Set(rows.map((r) => r.id));
    for (const fm of fuzzyMatches) {
      if (!existing.has(fm.id)) {
        rows.push(fm);
        fuzzyUsed = true;
      }
    }
  }

  res.json({ books: rows, count: rows.length, fuzzyUsed });
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const book = db.prepare(`${BOOK_SELECT} WHERE b.id = ? ${BOOK_GROUP}`).get(id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const user = tryOptionalAuth(req);
  let purchased = false;
  if (user) {
    purchased = !!db.prepare(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.book_id = ? AND o.status != 'cancelled'
       LIMIT 1`
    ).get(user.id, id);
  }

  const recommendations = db.prepare(
    `SELECT b.id, b.title, b.price, b.cover_image_url, a.name AS author_name,
            ROUND(AVG(r.rating), 1) AS avg_rating, COUNT(DISTINCT r.id) AS review_count,
            COUNT(*) AS freq
     FROM order_items oi1
     JOIN order_items oi2 ON oi1.order_id = oi2.order_id AND oi2.book_id != oi1.book_id
     JOIN books b ON b.id = oi2.book_id
     JOIN authors a ON a.id = b.author_id
     LEFT JOIN reviews r ON r.book_id = b.id
     WHERE oi1.book_id = ?
     GROUP BY oi2.book_id
     ORDER BY freq DESC
     LIMIT 6`
  ).all(id);

  res.json({ book, purchased, recommendations });
});

router.get('/:id/reviews', (req, res) => {
  const id = Number(req.params.id);
  const book = db.prepare('SELECT id FROM books WHERE id = ?').get(id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  const reviews = db.prepare(
    `SELECT r.id, r.rating, r.comment, r.verified_purchase, r.created_at, u.name AS user_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.book_id = ?
     ORDER BY r.created_at DESC`
  ).all(id);
  res.json({ reviews });
});

router.post(
  '/:id/reviews',
  authRequired,
  makeValidator({
    rating: { required: true, type: 'rating', message: 'Rating must be between 1 and 5' },
    comment: { type: 'string', min: 2, message: 'Review must be at least 2 characters' }
  }),
  (req, res) => {
    const bookId = Number(req.params.id);
    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const purchased = db.prepare(
      `SELECT 1 FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       WHERE o.user_id = ? AND oi.book_id = ? AND o.status != 'cancelled'
       LIMIT 1`
    ).get(req.user.id, bookId);
    if (!purchased) {
      return res.status(403).json({ error: 'You can only review books you have purchased' });
    }

    const existing = db.prepare('SELECT id FROM reviews WHERE user_id = ? AND book_id = ?').get(req.user.id, bookId);
    if (existing) {
      return res.status(409).json({ error: 'You have already reviewed this book' });
    }

    const result = db
      .prepare('INSERT INTO reviews (user_id, book_id, rating, comment, verified_purchase) VALUES (?, ?, ?, ?, 1)')
      .run(req.user.id, bookId, Number(req.body.rating), req.body.comment || null);
    const review = db.prepare(
      `SELECT r.id, r.rating, r.comment, r.verified_purchase, r.created_at, u.name AS user_name
       FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?`
    ).get(result.lastInsertRowid);
    res.status(201).json({ review });
  }
);

module.exports = router;

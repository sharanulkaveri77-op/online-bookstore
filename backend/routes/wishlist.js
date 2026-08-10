const express = require('express');
const path = require('path');
const { db } = require(path.join(__dirname, '..', 'db', 'database'));
const { authRequired } = require(path.join(__dirname, '..', 'middleware', 'auth'));
const { makeValidator } = require(path.join(__dirname, '..', 'middleware', 'validate'));

const router = express.Router();

router.use(authRequired);

const WISHLIST_SELECT = `
  SELECT w.id, w.book_id,
         b.title, b.price, b.stock_qty, b.cover_image_url,
         a.name AS author_name,
         CASE WHEN ci.id IS NOT NULL THEN 1 ELSE 0 END AS in_cart
  FROM wishlist_items w
  JOIN books b ON b.id = w.book_id
  JOIN authors a ON a.id = b.author_id
  LEFT JOIN cart_items ci ON ci.user_id = w.user_id AND ci.book_id = w.book_id
  WHERE w.user_id = ?
  ORDER BY w.id DESC
`;

router.get('/', (req, res) => {
  const items = db.prepare(WISHLIST_SELECT).all(req.user.id);
  res.json({ items });
});

router.post(
  '/',
  makeValidator({
    book_id: { required: true, type: 'int', min: 1, message: 'A valid book is required' }
  }),
  (req, res) => {
    const book = db.prepare('SELECT id FROM books WHERE id = ?').get(req.body.book_id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    db.prepare('INSERT OR IGNORE INTO wishlist_items (user_id, book_id) VALUES (?, ?)').run(req.user.id, req.body.book_id);
    const items = db.prepare(WISHLIST_SELECT).all(req.user.id);
    res.status(201).json({ message: 'Added to wishlist', items, count: items.length });
  }
);

router.delete('/:bookId', (req, res) => {
  const result = db.prepare('DELETE FROM wishlist_items WHERE user_id = ? AND book_id = ?').run(req.user.id, req.params.bookId);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Item not found in wishlist' });
  }
  res.json({ message: 'Removed from wishlist' });
});

router.post('/:bookId/move-to-cart', (req, res) => {
  const { bookId } = req.params;
  const wish = db.prepare('SELECT id FROM wishlist_items WHERE user_id = ? AND book_id = ?').get(req.user.id, bookId);
  if (!wish) {
    return res.status(404).json({ error: 'Item not found in wishlist' });
  }
  const book = db.prepare('SELECT id, stock_qty FROM books WHERE id = ?').get(bookId);
  const cart = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND book_id = ?').get(req.user.id, bookId);
  if (cart) {
    const newQty = cart.quantity + 1;
    if (newQty > book.stock_qty) {
      return res.status(400).json({ error: `Only ${book.stock_qty} copies of this book are in stock` });
    }
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, cart.id);
  } else {
    if (book.stock_qty < 1) {
      return res.status(400).json({ error: 'This book is out of stock' });
    }
    db.prepare('INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, 1)').run(req.user.id, bookId);
  }
  db.prepare('DELETE FROM wishlist_items WHERE id = ?').run(wish.id);
  const items = db.prepare(WISHLIST_SELECT).all(req.user.id);
  res.json({ message: 'Moved to cart', items });
});

module.exports = router;

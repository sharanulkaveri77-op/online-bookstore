const express = require('express');
const path = require('path');
const { db } = require(path.join(__dirname, '..', 'db', 'database'));
const { authRequired } = require(path.join(__dirname, '..', 'middleware', 'auth'));
const { makeValidator } = require(path.join(__dirname, '..', 'middleware', 'validate'));

const router = express.Router();

router.use(authRequired);

const CART_SELECT = `
  SELECT ci.id, ci.quantity,
         b.id AS book_id, b.title, b.price, b.stock_qty, b.cover_image_url,
         a.name AS author_name
  FROM cart_items ci
  JOIN books b ON b.id = ci.book_id
  JOIN authors a ON a.id = b.author_id
  WHERE ci.user_id = ?
  ORDER BY ci.id
`;

router.get('/', (req, res) => {
  const items = db.prepare(CART_SELECT).all(req.user.id);
  const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
  res.json({ items, subtotal: Math.round(subtotal * 100) / 100, count: items.reduce((s, it) => s + it.quantity, 0) });
});

router.post(
  '/',
  makeValidator({
    book_id: { required: true, type: 'int', min: 1, message: 'A valid book is required' },
    quantity: { required: true, type: 'int', min: 1, message: 'Quantity must be at least 1' }
  }),
  (req, res) => {
    const { book_id, quantity } = req.body;
    const book = db.prepare('SELECT id, title, stock_qty FROM books WHERE id = ?').get(book_id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    const existing = db.prepare('SELECT id, quantity FROM cart_items WHERE user_id = ? AND book_id = ?').get(req.user.id, book_id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      if (newQty > book.stock_qty) {
        return res.status(400).json({ error: `Only ${book.stock_qty} copies of this book are in stock` });
      }
      db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
    } else {
      if (quantity > book.stock_qty) {
        return res.status(400).json({ error: `Only ${book.stock_qty} copies of this book are in stock` });
      }
      db.prepare('INSERT INTO cart_items (user_id, book_id, quantity) VALUES (?, ?, ?)').run(req.user.id, book_id, quantity);
    }
    const items = db.prepare(CART_SELECT).all(req.user.id);
    res.status(201).json({ message: 'Added to cart', items, count: items.reduce((s, it) => s + it.quantity, 0) });
  }
);

router.put(
  '/:id',
  makeValidator({
    quantity: { required: true, type: 'int', min: 1, message: 'Quantity must be at least 1' }
  }),
  (req, res) => {
    const item = db.prepare('SELECT ci.id, b.stock_qty FROM cart_items ci JOIN books b ON b.id = ci.book_id WHERE ci.id = ? AND ci.user_id = ?').get(req.params.id, req.user.id);
    if (!item) {
      return res.status(404).json({ error: 'Cart item not found' });
    }
    if (req.body.quantity > item.stock_qty) {
      return res.status(400).json({ error: `Only ${item.stock_qty} copies of this book are in stock` });
    }
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(req.body.quantity, item.id);
    res.json({ message: 'Cart updated' });
  }
);

router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'Cart item not found' });
  }
  res.json({ message: 'Removed from cart' });
});

module.exports = router;

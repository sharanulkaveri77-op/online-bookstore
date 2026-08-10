require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, ensureSchema } = require(path.join(__dirname, 'db', 'database'));

ensureSchema();

if (db.prepare('SELECT COUNT(*) AS n FROM books').get().n === 0) {
  require(path.join(__dirname, 'db', 'seed'));
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require(path.join(__dirname, 'routes', 'auth')));
app.use('/api/books', require(path.join(__dirname, 'routes', 'books')));
app.use('/api/catalog', require(path.join(__dirname, 'routes', 'catalog')));
app.use('/api/cart', require(path.join(__dirname, 'routes', 'cart')));
app.use('/api/wishlist', require(path.join(__dirname, 'routes', 'wishlist')));
app.use('/api/orders', require(path.join(__dirname, 'routes', 'orders')));
app.use('/api/admin', require(path.join(__dirname, 'routes', 'admin')));

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BookNook API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
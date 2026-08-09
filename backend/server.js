require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, ensureSchema } = require('./db/database');

ensureSchema();

if (db.prepare('SELECT COUNT(*) AS n FROM books').get().n === 0) {
  require('./db/seed');
}

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/books', require('./routes/books'));
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));

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

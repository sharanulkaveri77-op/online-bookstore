const express = require('express');
const path = require('path');
const { db } = require(path.join(__dirname, '..', 'db', 'database'));

const router = express.Router();

router.get('/categories', (req, res) => {
  const rows = db.prepare('SELECT id, name FROM categories ORDER BY name').all();
  res.json(rows);
});

router.get('/authors', (req, res) => {
  const rows = db.prepare('SELECT id, name, bio FROM authors ORDER BY name').all();
  res.json(rows);
});

router.get('/publishers', (req, res) => {
  const rows = db.prepare('SELECT id, name FROM publishers ORDER BY name').all();
  res.json(rows);
});

module.exports = router;

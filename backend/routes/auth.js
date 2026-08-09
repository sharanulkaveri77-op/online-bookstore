const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/database');
const { signToken, authRequired } = require('../middleware/auth');
const { makeValidator } = require('../middleware/validate');

const router = express.Router();

const PUBLIC_USER = 'id, name, email, role, created_at';

router.post(
  '/register',
  makeValidator({
    name: { required: true, type: 'string', min: 2, message: 'Name must be at least 2 characters' },
    email: { required: true, type: 'email', message: 'Enter a valid email address' },
    password: { required: true, type: 'string', min: 8, message: 'Password must be at least 8 characters' }
  }),
  (req, res) => {
    const { name, email, password } = req.body;
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const password_hash = bcrypt.hashSync(password, 10);
    const result = db
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name.trim(), email.toLowerCase(), password_hash, 'customer');
    const user = db.prepare(`SELECT ${PUBLIC_USER} FROM users WHERE id = ?`).get(result.lastInsertRowid);
    res.status(201).json({ token: signToken(user), user });
  }
);

router.post(
  '/login',
  makeValidator({
    email: { required: true, type: 'email', message: 'Enter a valid email address' },
    password: { required: true, message: 'Password is required' }
  }),
  (req, res) => {
    const { email, password } = req.body;
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!row || !bcrypt.compareSync(password, row.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = db.prepare(`SELECT ${PUBLIC_USER} FROM users WHERE id = ?`).get(row.id);
    res.json({ token: signToken(user), user });
  }
);

router.get('/me', authRequired, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;

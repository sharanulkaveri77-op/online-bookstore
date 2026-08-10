const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || './data/bookstore.db';
const resolvedPath = path.resolve(__dirname, '..', DB_PATH);

fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);
db.pragma('journal_mode = DELETE');
db.pragma('foreign_keys = ON');

function initSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
}

function ensureSchema() {
  const exists = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'").get();
  if (!exists) {
    initSchema();
  }
}

module.exports.db = db;
module.exports.initSchema = initSchema;
module.exports.ensureSchema = ensureSchema;

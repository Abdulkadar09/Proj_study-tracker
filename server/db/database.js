const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, '..', '..', 'study.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const shouldInit = !fs.existsSync(dbPath);
const db = new Database(dbPath);

function initialize() {
  const schema = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
}

db.pragma('foreign_keys = ON');
initialize();

console.log(`SQLite database path: ${dbPath}${shouldInit ? ' (created)' : ''}`);

module.exports = db;

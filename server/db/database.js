const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.resolve(__dirname, '..', '..', 'study.db');
const shouldInit = !fs.existsSync(dbPath);
const db = new Database(dbPath);

function initialize() {
  const schema = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
  db.exec(schema);
}

if (shouldInit) {
  initialize();
}

module.exports = db;

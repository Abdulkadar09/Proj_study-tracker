const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is required. Set it to your Supabase PostgreSQL connection string.');
}

const pool = new Pool({
  connectionString,
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
});

async function initialize() {
  const schema = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(schema);
  console.log('PostgreSQL schema initialized');
}

module.exports = {
  initialize,
  query: (text, params) => pool.query(text, params),
  pool
};

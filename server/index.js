const path = require('path');
const express = require('express');
const cors = require('cors');
const subjectsRouter = require('./routes/subjects');
const sessionsRouter = require('./routes/sessions');
const statsRouter = require('./routes/stats');
const db = require('./db/database');

const app = express();
const port = process.env.PORT || 3001;
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');

app.use(cors());
app.use(express.json());

app.use('/subjects', subjectsRouter);
app.use('/sessions', sessionsRouter);
app.use('/stats', statsRouter);

app.use(express.static(clientDist));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (process.env.ENABLE_DEBUG_ENDPOINTS === 'true') {
  app.get('/debug/db', (req, res) => {
    const subjects = db.prepare('SELECT id, name, color, created_at FROM subjects ORDER BY id ASC').all();
    const sessionsSummary = db.prepare(
      'SELECT COUNT(*) AS count, MIN(started_at) AS first_started_at, MAX(started_at) AS last_started_at FROM sessions'
    ).get();

    res.json({
      database_path: process.env.DB_PATH || path.resolve(__dirname, '..', 'study.db'),
      foreign_keys_enabled: db.pragma('foreign_keys', { simple: true }) === 1,
      foreign_key_check: db.pragma('foreign_key_check'),
      subjects_count: subjects.length,
      subjects,
      sessions: sessionsSummary
    });
  });
}

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(port, () => {
  console.log(`Study Tracker API running on http://localhost:${port}`);
});

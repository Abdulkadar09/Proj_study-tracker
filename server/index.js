const path = require('path');
const express = require('express');
const cors = require('cors');
const subjectsRouter = require('./routes/subjects');
const sessionsRouter = require('./routes/sessions');
const statsRouter = require('./routes/stats');
const db = require('./db/database');
const requireAuth = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3001;
const clientDist = path.resolve(__dirname, '..', 'client', 'dist');

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

if (process.env.ENABLE_DEBUG_ENDPOINTS === 'true') {
  app.get('/debug/db', async (req, res) => {
    const subjectsResult = await db.query('SELECT COUNT(*)::int AS count FROM subjects');
    const sessionsResult = await db.query(
      'SELECT COUNT(*)::int AS count, MIN(started_at) AS first_started_at, MAX(started_at) AS last_started_at FROM sessions'
    );

    res.json({
      database: 'postgresql',
      subjects_count: subjectsResult.rows[0].count,
      sessions: sessionsResult.rows[0]
    });
  });
}

app.use('/subjects', requireAuth, subjectsRouter);
app.use('/sessions', requireAuth, sessionsRouter);
app.use('/stats', requireAuth, statsRouter);

app.use(express.static(clientDist));

app.use((error, req, res, next) => {
  console.error('API error', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

db.initialize()
  .then(() => {
    app.listen(port, () => {
      console.log(`Study Tracker API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database', error);
    process.exit(1);
  });

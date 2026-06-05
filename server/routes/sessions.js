const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT s.id,
           s.subject_id,
           sub.name AS subject_name,
           sub.color AS subject_color,
           s.started_at,
           s.ended_at,
           s.duration_seconds
    FROM sessions s
    JOIN subjects sub ON sub.id = s.subject_id
    ORDER BY s.started_at DESC
  `).all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { subject_id, started_at, ended_at, duration_seconds } = req.body;
  if (!subject_id || !started_at || !ended_at || duration_seconds == null) {
    return res.status(400).json({ error: 'Missing session fields' });
  }
  const stmt = db.prepare(
    'INSERT INTO sessions (subject_id, started_at, ended_at, duration_seconds) VALUES (?, ?, ?, ?)'
  );
  const info = stmt.run(subject_id, started_at, ended_at, duration_seconds);
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(session);
});

router.patch('/:id', (req, res) => {
  const sessionId = Number(req.params.id);
  const { duration_seconds } = req.body;
  if (!sessionId || duration_seconds == null || typeof duration_seconds !== 'number') {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const session = db.prepare('SELECT started_at FROM sessions WHERE id = ?').get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const endedAt = session.started_at + duration_seconds * 1000;
  const stmt = db.prepare('UPDATE sessions SET duration_seconds = ?, ended_at = ? WHERE id = ?');
  const info = stmt.run(duration_seconds, endedAt, sessionId);
  if (!info.changes) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const updated = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  const sessionId = Number(req.params.id);
  if (!sessionId) {
    return res.status(400).json({ error: 'Invalid session id' });
  }
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  const info = stmt.run(sessionId);
  res.json({ deleted: info.changes > 0 });
});

module.exports = router;

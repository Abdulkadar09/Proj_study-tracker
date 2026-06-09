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
  const payload = {
    subject_id: Number(subject_id),
    started_at: Number(started_at),
    ended_at: Number(ended_at),
    duration_seconds: Number(duration_seconds)
  };

  if (
    !Number.isInteger(payload.subject_id) ||
    payload.subject_id <= 0 ||
    !Number.isFinite(payload.started_at) ||
    !Number.isFinite(payload.ended_at) ||
    !Number.isFinite(payload.duration_seconds) ||
    payload.duration_seconds < 0
  ) {
    console.warn('Invalid session payload', req.body);
    return res.status(400).json({ error: 'Invalid session fields' });
  }

  const subject = db.prepare('SELECT id, name FROM subjects WHERE id = ?').get(payload.subject_id);
  if (!subject) {
    const subjectsSummary = db.prepare('SELECT COUNT(*) AS count, GROUP_CONCAT(id) AS ids FROM subjects').get();
    console.warn('Session rejected because subject_id was not found', {
      requested_subject_id: payload.subject_id,
      subjects_count: subjectsSummary.count,
      subject_ids: subjectsSummary.ids
    });
    return res.status(404).json({ error: 'Subject not found for session' });
  }

  try {
    const stmt = db.prepare(
      'INSERT INTO sessions (subject_id, started_at, ended_at, duration_seconds) VALUES (?, ?, ?, ?)'
    );
    const info = stmt.run(
      payload.subject_id,
      payload.started_at,
      payload.ended_at,
      payload.duration_seconds
    );
    const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(session);
  } catch (error) {
    console.error('Failed to create session', { payload, error });
    res.status(500).json({ error: 'Could not create session' });
  }
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

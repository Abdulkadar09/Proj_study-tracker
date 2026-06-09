const express = require('express');
const router = express.Router();
const db = require('../db/database');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT s.id,
           s.subject_id,
           sub.name AS subject_name,
           sub.color AS subject_color,
           s.started_at,
           s.ended_at,
           s.duration_seconds
    FROM sessions s
    JOIN subjects sub ON sub.id = s.subject_id
    WHERE sub.user_id = $1
    ORDER BY s.started_at DESC
  `, [req.user.id]);
  res.json(rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const payload = {
    subject_id: Number(req.body.subject_id),
    started_at: Number(req.body.started_at),
    ended_at: Number(req.body.ended_at),
    duration_seconds: Number(req.body.duration_seconds)
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

  const subjectResult = await db.query(
    'SELECT id, name FROM subjects WHERE id = $1 AND user_id = $2',
    [payload.subject_id, req.user.id]
  );
  if (!subjectResult.rows[0]) {
    console.warn('Session rejected because subject_id was not found for user', {
      requested_subject_id: payload.subject_id,
      user_id: req.user.id
    });
    return res.status(404).json({ error: 'Subject not found for session' });
  }

  const { rows } = await db.query(
    `INSERT INTO sessions (subject_id, started_at, ended_at, duration_seconds)
     VALUES ($1, $2, $3, $4)
     RETURNING id, subject_id, started_at, ended_at, duration_seconds`,
    [payload.subject_id, payload.started_at, payload.ended_at, payload.duration_seconds]
  );
  res.status(201).json(rows[0]);
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const sessionId = Number(req.params.id);
  const durationSeconds = Number(req.body.duration_seconds);
  if (!sessionId || !Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const sessionResult = await db.query(`
    SELECT s.started_at
    FROM sessions s
    JOIN subjects sub ON sub.id = s.subject_id
    WHERE s.id = $1 AND sub.user_id = $2
  `, [sessionId, req.user.id]);

  const session = sessionResult.rows[0];
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const endedAt = Number(session.started_at) + durationSeconds * 1000;
  const { rows } = await db.query(`
    UPDATE sessions
    SET duration_seconds = $1, ended_at = $2
    WHERE id = $3
    RETURNING id, subject_id, started_at, ended_at, duration_seconds
  `, [durationSeconds, endedAt, sessionId]);

  res.json(rows[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const sessionId = Number(req.params.id);
  if (!sessionId) {
    return res.status(400).json({ error: 'Invalid session id' });
  }

  const { rowCount } = await db.query(`
    DELETE FROM sessions s
    USING subjects sub
    WHERE s.subject_id = sub.id
      AND s.id = $1
      AND sub.user_id = $2
  `, [sessionId, req.user.id]);

  res.json({ deleted: rowCount > 0 });
}));

module.exports = router;

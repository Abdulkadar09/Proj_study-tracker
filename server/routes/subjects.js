const express = require('express');
const router = express.Router();
const db = require('../db/database');
const asyncHandler = require('../middleware/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, color FROM subjects WHERE user_id = $1 ORDER BY created_at ASC',
    [req.user.id]
  );
  res.json(rows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) {
    return res.status(400).json({ error: 'Missing name or color' });
  }

  const { rows } = await db.query(
    'INSERT INTO subjects (user_id, name, color, created_at) VALUES ($1, $2, $3, $4) RETURNING id, name, color, created_at',
    [req.user.id, name.trim(), color, Date.now()]
  );
  res.status(201).json(rows[0]);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const subjectId = Number(req.params.id);
  if (!subjectId) {
    return res.status(400).json({ error: 'Invalid subject id' });
  }

  const { rowCount } = await db.query(
    'DELETE FROM subjects WHERE id = $1 AND user_id = $2',
    [subjectId, req.user.id]
  );
  res.json({ deleted: rowCount > 0 });
}));

module.exports = router;

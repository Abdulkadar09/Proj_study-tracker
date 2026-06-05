const express = require('express');
const router = express.Router();
const db = require('../db/database');

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name, color FROM subjects ORDER BY created_at ASC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) {
    return res.status(400).json({ error: 'Missing name or color' });
  }
  const stmt = db.prepare('INSERT INTO subjects (name, color, created_at) VALUES (?, ?, ?)');
  const info = stmt.run(name.trim(), color, Date.now());
  const subject = db.prepare('SELECT id, name, color, created_at FROM subjects WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json(subject);
});

router.delete('/:id', (req, res) => {
  const subjectId = Number(req.params.id);
  if (!subjectId) {
    return res.status(400).json({ error: 'Invalid subject id' });
  }
  const stmt = db.prepare('DELETE FROM subjects WHERE id = ?');
  const info = stmt.run(subjectId);
  res.json({ deleted: info.changes > 0 });
});

module.exports = router;

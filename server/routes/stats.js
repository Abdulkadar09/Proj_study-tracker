const express = require('express');
const router = express.Router();
const db = require('../db/database');
const asyncHandler = require('../middleware/asyncHandler');

function getDayStartTimestamp(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

router.get('/summary', asyncHandler(async (req, res) => {
  const now = Date.now();
  const todayStart = getDayStartTimestamp(now);
  const monday = new Date(now);
  const day = monday.getDay();
  const offset = day === 0 ? 6 : day - 1;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - offset);
  const weekStart = monday.getTime();

  const todayResult = await db.query(`
    SELECT COALESCE(SUM(s.duration_seconds), 0)::int AS total
    FROM sessions s
    JOIN subjects sub ON sub.id = s.subject_id
    WHERE sub.user_id = $1 AND s.started_at >= $2
  `, [req.user.id, todayStart]);

  const weekResult = await db.query(`
    SELECT COALESCE(SUM(s.duration_seconds), 0)::int AS total
    FROM sessions s
    JOIN subjects sub ON sub.id = s.subject_id
    WHERE sub.user_id = $1 AND s.started_at >= $2
  `, [req.user.id, weekStart]);

  res.json({
    today_seconds: todayResult.rows[0].total,
    week_seconds: weekResult.rows[0].total
  });
}));

router.get('/subjects', asyncHandler(async (req, res) => {
  const { rows } = await db.query(`
    SELECT sub.id AS subject_id,
           sub.name AS subject_name,
           sub.color AS subject_color,
           COALESCE(SUM(s.duration_seconds), 0)::int AS total_seconds
    FROM subjects sub
    LEFT JOIN sessions s ON s.subject_id = sub.id
    WHERE sub.user_id = $1
    GROUP BY sub.id
    ORDER BY total_seconds DESC, sub.name ASC
  `, [req.user.id]);
  res.json(rows);
}));

router.get('/daily', asyncHandler(async (req, res) => {
  const from = Number(req.query.from) || 0;
  const to = Number(req.query.to) || Date.now();

  const totalResult = await db.query(`
    SELECT to_char(to_timestamp(s.started_at / 1000)::date, 'YYYY-MM-DD') AS date,
           COALESCE(SUM(s.duration_seconds), 0)::int AS total_seconds
    FROM sessions s
    JOIN subjects sub ON sub.id = s.subject_id
    WHERE sub.user_id = $1 AND s.started_at BETWEEN $2 AND $3
    GROUP BY date
    ORDER BY date ASC
  `, [req.user.id, from, to]);

  const subjectResult = await db.query(`
    SELECT to_char(to_timestamp(s.started_at / 1000)::date, 'YYYY-MM-DD') AS date,
           sub.id AS subject_id,
           sub.name AS subject_name,
           sub.color AS subject_color,
           COALESCE(SUM(s.duration_seconds), 0)::int AS total_seconds
    FROM sessions s
    JOIN subjects sub ON sub.id = s.subject_id
    WHERE sub.user_id = $1 AND s.started_at BETWEEN $2 AND $3
    GROUP BY date, sub.id
    ORDER BY date ASC
  `, [req.user.id, from, to]);

  const byDate = totalResult.rows.map((row) => ({
    date: row.date,
    total_seconds: row.total_seconds,
    subjects: []
  }));

  subjectResult.rows.forEach((row) => {
    const group = byDate.find((item) => item.date === row.date);
    if (group) {
      group.subjects.push({
        subject_id: row.subject_id,
        subject_name: row.subject_name,
        subject_color: row.subject_color,
        total_seconds: row.total_seconds
      });
    }
  });

  res.json(byDate);
}));

module.exports = router;

const express = require('express');
const router = express.Router();
const db = require('../db/database');

function getDayStartTimestamp(timestamp) {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

router.get('/summary', (req, res) => {
  const now = Date.now();
  const todayStart = getDayStartTimestamp(now);
  const monday = new Date(now);
  const day = monday.getDay();
  const offset = day === 0 ? 6 : day - 1;
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - offset);
  const weekStart = monday.getTime();

  const todayRow = db.prepare(
    'SELECT IFNULL(SUM(duration_seconds), 0) AS total FROM sessions WHERE started_at >= ?'
  ).get(todayStart);
  const weekRow = db.prepare(
    'SELECT IFNULL(SUM(duration_seconds), 0) AS total FROM sessions WHERE started_at >= ?'
  ).get(weekStart);

  res.json({ today_seconds: todayRow.total, week_seconds: weekRow.total });
});

router.get('/subjects', (req, res) => {
  const rows = db.prepare(`
    SELECT sub.id AS subject_id,
           sub.name AS subject_name,
           sub.color AS subject_color,
           IFNULL(SUM(s.duration_seconds), 0) AS total_seconds
    FROM subjects sub
    LEFT JOIN sessions s ON s.subject_id = sub.id
    GROUP BY sub.id
    ORDER BY total_seconds DESC, sub.name ASC
  `).all();
  res.json(rows);
});

router.get('/daily', (req, res) => {
  const from = Number(req.query.from) || 0;
  const to = Number(req.query.to) || Date.now();
  const rows = db.prepare(`
    SELECT date(started_at / 1000, 'unixepoch', 'localtime') AS date,
           SUM(duration_seconds) AS total_seconds
    FROM sessions
    WHERE started_at / 1000 BETWEEN ? AND ?
    GROUP BY date
    ORDER BY date ASC
  `).all(Math.round(from / 1000), Math.round(to / 1000));

  const subjectRows = db.prepare(`
    SELECT date(s.started_at / 1000, 'unixepoch', 'localtime') AS date,
           sub.id AS subject_id,
           sub.name AS subject_name,
           sub.color AS subject_color,
           SUM(s.duration_seconds) AS total_seconds
    FROM sessions s
    JOIN subjects sub ON sub.id = s.subject_id
    WHERE s.started_at / 1000 BETWEEN ? AND ?
    GROUP BY date, sub.id
    ORDER BY date ASC
  `).all(Math.round(from / 1000), Math.round(to / 1000));

  const byDate = rows.map((row) => ({
    date: row.date,
    total_seconds: row.total_seconds,
    subjects: []
  }));

  subjectRows.forEach((row) => {
    const group = byDate.find((item) => item.date === row.date);
    if (group) {
      group.subjects.push({
        subject_name: row.subject_name,
        subject_color: row.subject_color,
        total_seconds: row.total_seconds
      });
    }
  });

  res.json(byDate);
});

module.exports = router;

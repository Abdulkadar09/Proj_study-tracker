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

app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(port, () => {
  console.log(`Study Tracker API running on http://localhost:${port}`);
});

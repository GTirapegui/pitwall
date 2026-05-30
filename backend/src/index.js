require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const scheduleRouter = require('./routes/schedule');
const nextEventRouter = require('./routes/nextEvent');
const standingsRouter = require('./routes/standings');
const resultsRouter    = require('./routes/results');
const liveStatusRouter  = require('./routes/liveStatus');
const headlinesRouter   = require('./routes/headlines');
const circuitMapRouter  = require('./routes/circuitMap');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/schedule', scheduleRouter);
app.use('/api/next-event', nextEventRouter);
app.use('/api/standings', standingsRouter);
app.use('/api/results', resultsRouter);
app.use('/api/live',      liveStatusRouter);
app.use('/api/headlines',    headlinesRouter);
app.use('/api/circuit-map', circuitMapRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Pitwall backend running on http://localhost:${PORT}`);
});

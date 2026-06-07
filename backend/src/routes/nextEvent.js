const express = require('express');
const router  = express.Router();
const { buildAndCacheSchedule } = require('./schedule');

// GET /api/next-event — upcoming race weekend with sessions
router.get('/', async (req, res) => {
  const year = new Date().getFullYear();
  try {
    const { meetings, totalRounds } = await buildAndCacheSchedule(year);
    const now  = new Date();
    const next = meetings.find(m => !m.isCancelled && new Date(m.dateEnd) > now) ?? null;

    if (!next) {
      const last = [...meetings].reverse().find(m => !m.isCancelled) ?? meetings[meetings.length - 1];
      return res.json({ totalRounds, mode: 'lastRace', ...last });
    }

    res.json({ totalRounds, ...next });
  } catch (err) {
    console.error('[next-event]', err.message);
    res.status(502).json({ error: 'Failed to fetch next event', detail: err.message });
  }
});

module.exports = router;

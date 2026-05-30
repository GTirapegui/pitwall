const express = require('express');
const router = express.Router();
const cache = require('../cache/memoryCache');
const { getMeetings, getSessions } = require('../services/openf1');

// GET /api/next-event — upcoming race weekend with sessions
router.get('/', async (req, res) => {
  const year = new Date().getFullYear();
  const cacheKey = `next_event_${year}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [meetings, sessions] = await Promise.all([
      getMeetings(year),
      getSessions(year),
    ]);

    // Build session index by meeting_key
    const sessionsByMeeting = new Map();
    for (const s of sessions) {
      const key = s.meeting_key;
      if (!sessionsByMeeting.has(key)) sessionsByMeeting.set(key, []);
      sessionsByMeeting.get(key).push({
        sessionKey: s.session_key,
        sessionName: s.session_name,
        sessionType: s.session_type,
        dateStart: s.date_start,
        dateEnd: s.date_end,
      });
    }

    const raceWeekends = meetings
      .filter(m => !m.meeting_name.toLowerCase().includes('testing'))
      .sort((a, b) => a.date_start.localeCompare(b.date_start))
      .map((m, i) => ({
        round: i + 1,
        meetingKey: m.meeting_key,
        meetingName: m.meeting_name,
        circuitShortName: m.circuit_short_name,
        countryName: m.country_name,
        countryCode: m.country_code,
        location: m.location,
        dateStart: m.date_start,
        dateEnd: m.date_end,
        isCancelled: m.is_cancelled,
        sessions: (sessionsByMeeting.get(m.meeting_key) || [])
          .sort((a, b) => a.dateStart.localeCompare(b.dateStart)),
      }));

    const now = new Date();
    const next = raceWeekends.find(m => !m.isCancelled && new Date(m.dateEnd) > now) || null;

    if (!next) {
      // Season over — return the last non-cancelled race so the UI can show it
      const last = [...raceWeekends].reverse().find(m => !m.isCancelled) || raceWeekends[raceWeekends.length - 1];
      const result = { totalRounds: raceWeekends.length, mode: 'lastRace', ...last };
      cache.set(cacheKey, result, 3600);
      return res.json(result);
    }

    const result = { totalRounds: raceWeekends.length, ...next };
    cache.set(cacheKey, result, 60);
    res.json(result);
  } catch (err) {
    console.error('[next-event]', err.message);
    res.status(502).json({ error: 'Failed to fetch next event', detail: err.message });
  }
});

module.exports = router;

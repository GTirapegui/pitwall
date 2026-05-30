const express = require('express');
const router = express.Router();
const cache = require('../cache/memoryCache');
const { getMeetings, getSessions } = require('../services/openf1');

// GET /api/schedule — all race weekends for the current season
router.get('/', async (req, res) => {
  const year = new Date().getFullYear();
  const cacheKey = `schedule_${year}`;
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

    // Filter to race weekends only (exclude pre-season testing)
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

    const result = { season: year, totalRounds: raceWeekends.length, meetings: raceWeekends };
    cache.set(cacheKey, result, 3600); // 1h — schedule rarely changes mid-season
    res.json(result);
  } catch (err) {
    console.error('[schedule]', err.message);
    res.status(502).json({ error: 'Failed to fetch schedule', detail: err.message });
  }
});

module.exports = router;

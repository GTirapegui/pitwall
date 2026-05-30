const express = require('express');
const router  = express.Router();
const cache   = require('../cache/memoryCache');
const { get } = require('../services/openf1');

// GET /api/live/status
// Returns whether a session is currently live (or in the 30-min extended window)
router.get('/status', async (req, res) => {
  const CACHE_KEY = 'live_status';
  const cached = cache.get(CACHE_KEY);
  if (cached) return res.json(cached);

  try {
    // Fetch the most recent session from OpenF1
    const sessions = await get('/sessions', { session_key: 'latest' });
    const session  = Array.isArray(sessions) && sessions.length > 0 ? sessions[0] : null;

    let isLive = false;
    let sessionInfo = null;

    if (session) {
      const now   = Date.now();
      const start = new Date(session.date_start).getTime();
      const end   = new Date(session.date_end).getTime();

      // 30-min extended window before/after for OpenF1 live data availability
      const WINDOW_MS = 30 * 60 * 1000;
      isLive = now >= (start - WINDOW_MS) && now <= (end + WINDOW_MS);

      sessionInfo = {
        sessionKey:  session.session_key,
        name:        session.session_name,
        type:        session.session_type,
        gp:          session.meeting_official_name ?? session.location ?? '',
        country:     session.country_name ?? '',
        location:    session.location ?? '',
        circuitShort:session.circuit_short_name ?? '',
        dateStart:   session.date_start,
        dateEnd:     session.date_end,
      };
    }

    const result = { isLive, session: sessionInfo };
    // Short cache: 60s — needs to be fresh to detect start/end
    cache.set(CACHE_KEY, result, 60);
    res.json(result);
  } catch (err) {
    console.error('[live/status]', err.message);
    // On error return not-live rather than crashing the UI
    res.json({ isLive: false, session: null });
  }
});

// GET /api/live/positions?session_key=<key>
// Merges position + driver info + intervals. Cache: 3 s.
router.get('/positions', async (req, res) => {
  const { session_key } = req.query;
  if (!session_key) return res.status(400).json({ error: 'session_key required' });

  const cacheKey = `live_pos_${session_key}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [positions, drivers, intervals, laps] = await Promise.all([
      get('/position',  { session_key }),
      get('/drivers',   { session_key }),
      get('/intervals', { session_key }).catch(() => []),
      get('/laps',      { session_key, lap_number: 'latest' }).catch(() => []),
    ]);

    const latestPos = new Map();
    for (const p of positions) latestPos.set(p.driver_number, p.position);

    const latestGap = new Map();
    const latestInterval = new Map();
    for (const iv of intervals) {
      if (iv.gap_to_leader !== null && iv.gap_to_leader !== undefined)
        latestGap.set(iv.driver_number, iv.gap_to_leader);
      if (iv.interval !== null && iv.interval !== undefined)
        latestInterval.set(iv.driver_number, iv.interval);
    }

    const latestLap = new Map();
    for (const lap of laps) {
      if (lap.lap_duration && lap.driver_number)
        latestLap.set(lap.driver_number, lap.lap_duration);
    }

    const driverMap = new Map();
    for (const d of drivers) {
      driverMap.set(d.driver_number, {
        abbreviation: d.name_acronym,
        firstName:    d.first_name,
        lastName:     d.last_name,
        teamName:     d.team_name,
        teamColour:   d.team_colour ? `#${d.team_colour}` : '#8A8A8E',
      });
    }

    const standings = Array.from(latestPos.entries())
      .map(([num, pos]) => {
        const d   = driverMap.get(num) ?? { abbreviation:'?', firstName:'', lastName:String(num), teamName:'', teamColour:'#8A8A8E' };
        const raw = latestGap.get(num);
        const gap = pos === 1 ? 'LÍDER'
          : raw === undefined ? '—'
          : typeof raw === 'number' ? `+${raw.toFixed(3)}s`
          : String(raw);
        const ivRaw = latestInterval.get(num);
        const interval = ivRaw !== undefined
          ? (typeof ivRaw === 'number' ? `+${ivRaw.toFixed(3)}s` : String(ivRaw))
          : undefined;
        const lapDur = latestLap.get(num);
        const lastLap = lapDur ? formatLapTime(lapDur) : undefined;
        return { driverNumber: num, position: pos, gap, interval, lastLap, ...d };
      })
      .sort((a, b) => a.position - b.position);

    const result = { sessionKey: session_key, standings };
    cache.set(cacheKey, result, 3); // 3 s — fresh for live timing
    res.json(result);
  } catch (err) {
    console.error('[live/positions]', err.message);
    res.status(502).json({ error: err.message });
  }
});

// GET /api/live/intervals?session_key=<key>
router.get('/intervals', async (req, res) => {
  const { session_key } = req.query;
  if (!session_key) return res.status(400).json({ error: 'session_key required' });

  const cacheKey = `live_iv_${session_key}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const raw = await get('/intervals', { session_key });
    const result = { sessionKey: session_key, intervals: raw };
    cache.set(cacheKey, result, 3);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// GET /api/live/lap?session_key=<key>
router.get('/lap', async (req, res) => {
  const { session_key } = req.query;
  if (!session_key) return res.status(400).json({ error: 'session_key required' });

  const cacheKey = `live_lap_${session_key}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const raw = await get('/laps', { session_key, lap_number: 'latest' }).catch(() => []);
    const result = { sessionKey: session_key, laps: raw };
    cache.set(cacheKey, result, 3);
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

function formatLapTime(secs) {
  const m = Math.floor(secs / 60);
  const s = (secs - m * 60).toFixed(3).padStart(6, '0');
  return `${m}:${s}`;
}

module.exports = router;

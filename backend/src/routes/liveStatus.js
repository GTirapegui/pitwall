const express = require('express');
const router  = express.Router();
const cache   = require('../cache/memoryCache');
const { get } = require('../services/openf1');
const axios   = require('axios');

const F1_INDEX_BASE = 'https://livetiming.formula1.com/static';
const WINDOW_MS     = 30 * 60 * 1000;

function gmtOffsetToMs(offset) {
  // "02:00:00" → +7200000, "-04:00:00" → -14400000
  const sign = offset.startsWith('-') ? -1 : 1;
  const [h, m] = offset.replace(/^-/, '').split(':');
  return sign * (parseInt(h, 10) * 60 + parseInt(m, 10)) * 60 * 1000;
}

function localToUtcMs(localStr, gmtOffset) {
  // F1 dates are local time; convert to UTC by subtracting the offset
  return new Date(localStr + 'Z').getTime() - gmtOffsetToMs(gmtOffset || '00:00:00');
}

async function findLiveSession() {
  const year     = new Date().getFullYear();
  const cacheKey = `f1_index_${year}`;

  let index = cache.get(cacheKey);
  if (!index) {
    const { data } = await axios.get(`${F1_INDEX_BASE}/${year}/Index.json`, {
      timeout: 8000,
      responseType: 'json',
    });
    index = data;
    cache.set(cacheKey, index, 300); // refresh every 5 min
  }

  const now = Date.now();
  for (const meeting of (index.Meetings || [])) {
    for (const session of (meeting.Sessions || [])) {
      if (!session.StartDate || !session.EndDate) continue;
      const start = localToUtcMs(session.StartDate, session.GmtOffset);
      const end   = localToUtcMs(session.EndDate,   session.GmtOffset);
      if (now >= (start - WINDOW_MS) && now <= (end + WINDOW_MS)) {
        return {
          sessionKey:   session.Key,
          name:         session.Name,
          type:         session.Type,
          gp:           meeting.OfficialName ?? meeting.Name ?? '',
          meetingName:  meeting.Name ?? '',
          country:      meeting.Country?.Name ?? '',
          location:     meeting.Location ?? '',
          circuitShort: meeting.Circuit?.ShortName ?? '',
          dateStart:    session.StartDate,
          dateEnd:      session.EndDate,
        };
      }
    }
  }
  return null;
}

// GET /api/live/status
router.get('/status', async (req, res) => {
  const CACHE_KEY = 'live_status';
  const cached = cache.get(CACHE_KEY);
  if (cached) return res.json(cached);

  try {
    const session = await findLiveSession();
    const result  = { isLive: !!session, session };
    cache.set(CACHE_KEY, result, 60);
    res.json(result);
  } catch (err) {
    console.error('[live/status]', err.message);
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

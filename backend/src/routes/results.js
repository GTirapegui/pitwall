const express = require('express');
const router = express.Router();
const cache = require('../cache/memoryCache');
const { getMeetings, getSessions, get } = require('../services/openf1');

const TEAM_COLORS = {
  'McLaren': '#FF8000', 'Ferrari': '#E8002D', 'Mercedes': '#27F4D2',
  'Red Bull Racing': '#3671C6', 'Williams': '#1868DB', 'Aston Martin': '#229971',
  'RB': '#6692FF', 'Racing Bulls': '#6692FF', 'Kick Sauber': '#52E252',
  'Haas F1 Team': '#B6BABD', 'Alpine': '#00A1E8',
};

const DRIVER_FLAGS = {
  'VER': '🇳🇱', 'NOR': '🇬🇧', 'PIA': '🇦🇺', 'LEC': '🇲🇨',
  'RUS': '🇬🇧', 'HAM': '🇬🇧', 'ANT': '🇮🇹', 'SAI': '🇪🇸',
  'ALO': '🇪🇸', 'STR': '🇨🇦', 'GAS': '🇫🇷', 'OCO': '🇫🇷',
  'ALB': '🇹🇭', 'TSU': '🇯🇵', 'HAD': '🇫🇷', 'LAW': '🇳🇿',
  'BOT': '🇫🇮', 'HUL': '🇩🇪', 'MAG': '🇩🇰', 'BEA': '🇬🇧',
  'DOO': '🇦🇺', 'COL': '🇦🇷', 'PER': '🇲🇽', 'ZHO': '🇨🇳',
  'BOR': '🇧🇷', 'SAR': '🇺🇸',
};

const POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// ── Shared builder — returns the full results object for a given session ───────
// meetingSessions: all sessions for the same meeting, used as fallback for driver lookup
async function buildResultsForSession(sessionKey, round, meeting, raceWeekends, meetingSessions = []) {
  // All calls get .catch(() => []) so a single OpenF1 failure doesn't kill the whole response
  const [positions, laps, intervals] = await Promise.all([
    get('/position', { session_key: sessionKey }).catch(() => []),
    get('/laps',     { session_key: sessionKey }).catch(() => []),
    get('/intervals',{ session_key: sessionKey }).catch(() => []),
  ]);

  // Fetch driver roster with a three-level fallback:
  // 1. Race session itself
  // 2. Other sessions from the same meeting (qualifying/practice share the same lineup)
  // 3. session_key=latest — catches cases where the entire meeting has no data yet in OpenF1
  let drivers = await get('/drivers', { session_key: sessionKey }).catch(() => []);

  if (drivers.length === 0 && meetingSessions.length > 0) {
    const SESSION_PRIORITY = { 'Qualifying': 0, 'Sprint Qualifying': 1, 'Sprint': 2,
      'Practice 3': 3, 'Practice 2': 4, 'Practice 1': 5 };
    const fallbacks = meetingSessions
      .filter(s => s.session_key !== sessionKey)
      .sort((a, b) => (SESSION_PRIORITY[a.session_name] ?? 99) - (SESSION_PRIORITY[b.session_name] ?? 99));
    for (const sess of fallbacks) {
      drivers = await get('/drivers', { session_key: sess.session_key }).catch(() => []);
      if (drivers.length > 0) {
        console.log(`[results] driver fallback: meeting session ${sess.session_key} (${sess.session_name})`);
        break;
      }
    }
  }

  if (drivers.length === 0) {
    // Last resort: fetch from the globally latest session OpenF1 has data for.
    // Driver numbers/names are stable across a season so this gives correct identity info.
    // Cache aggressively (6h) since the roster barely changes mid-season.
    const latestKey = 'drivers_latest_roster';
    drivers = cache.get(latestKey) || [];
    if (drivers.length === 0) {
      drivers = await get('/drivers', { session_key: 'latest' }).catch(() => []);
      if (drivers.length > 0) {
        cache.set(latestKey, drivers, 21600); // 6h
        console.log(`[results] driver fallback: session_key=latest (${drivers.length} drivers)`);
      }
    } else {
      console.log(`[results] driver fallback: cached latest roster`);
    }
  }

  const driverInfo = new Map();
  for (const d of drivers) {
    driverInfo.set(d.driver_number, {
      driverNumber: d.driver_number,
      abbreviation: d.name_acronym,
      firstName:    d.first_name,
      lastName:     d.last_name,
      teamName:     d.team_name,
      teamColor:    TEAM_COLORS[d.team_name] || '#8A8A8E',
      flag:         DRIVER_FLAGS[d.name_acronym] || '🏳️',
    });
  }

  const finalPos = new Map();
  for (const pos of positions) finalPos.set(pos.driver_number, pos.position);

  function scanFastest(lapArr) {
    let driver = null, best = Infinity;
    for (const lap of lapArr) {
      if (lap.lap_duration > 0 && lap.lap_duration < best) {
        best   = lap.lap_duration;
        driver = lap.driver_number;
      }
    }
    return { driver, duration: best };
  }

  let { driver: fastestLapDriver, duration: fastestLapDuration } = scanFastest(laps);

  // If the initial laps fetch had no usable data, try a targeted fetch that
  // filters out pit-out laps (smaller response, more likely to have valid durations).
  if (fastestLapDriver === null) {
    const targeted = await get('/laps', { session_key: sessionKey, is_pit_out_lap: false }).catch(() => []);
    ({ driver: fastestLapDriver, duration: fastestLapDuration } = scanFastest(targeted));
    if (fastestLapDriver !== null) {
      console.log(`[results] fastest lap via targeted fetch: driver ${fastestLapDriver} ${fastestLapDuration}s`);
    }
  }

  // Format seconds → "m:ss.sss"  e.g. 83.456 → "1:23.456"
  const fastestLapTime = (fastestLapDriver !== null && isFinite(fastestLapDuration))
    ? (() => {
        const m = Math.floor(fastestLapDuration / 60);
        const s = (fastestLapDuration % 60).toFixed(3).padStart(6, '0');
        return `${m}:${s}`;
      })()
    : null;

  const totalLaps = laps.length > 0 ? Math.max(...laps.map(l => l.lap_number || 0)) : null;

  const finalGap = new Map();
  for (const iv of intervals) {
    if (iv.gap_to_leader !== null && iv.gap_to_leader !== undefined) {
      finalGap.set(iv.driver_number, iv.gap_to_leader);
    }
  }

  if (finalPos.size === 0) {
    console.warn(`[results] session ${sessionKey}: no position data from OpenF1`);
    return null; // caller will handle as "data not available"
  }

  const results = Array.from(finalPos.entries())
    .map(([num, pos]) => {
      const info = driverInfo.get(num) || {
        driverNumber: num, abbreviation: '???', firstName: '', lastName: String(num),
        teamName: 'Unknown', teamColor: '#8A8A8E', flag: '🏳️',
      };
      const rawGap = finalGap.get(num);
      let gap = null;
      if (pos !== 1 && rawGap !== undefined) {
        gap = typeof rawGap === 'number' ? `+${rawGap.toFixed(3)}s` : String(rawGap);
      }
      return {
        ...info, position: pos,
        points: pos >= 1 && pos <= 10 ? POINTS_SYSTEM[pos - 1] : 0,
        fastestLap: num === fastestLapDriver,
        gap,
      };
    })
    .sort((a, b) => a.position - b.position);

  const fastestLapAbbreviation = fastestLapDriver !== null
    ? (driverInfo.get(fastestLapDriver)?.abbreviation ?? null)
    : null;

  return {
    round,
    totalRounds:            raceWeekends.length,
    meetingName:            meeting.meeting_name || '',
    circuitShortName:       meeting.circuit_short_name || '',
    countryName:            meeting.country_name || '',
    countryCode:            meeting.country_code || '',
    dateStart:              meeting.date_start || '',
    totalLaps,
    fastestLapTime,
    fastestLapAbbreviation,
    results,
  };
}

// ── Shared: load meetings + sessions for a year with 30-min cache ─────────────
async function getYearData(year) {
  const ck = `year_data_${year}`;
  const hit = cache.get(ck);
  if (hit) return hit;

  const [meetings, sessions] = await Promise.all([
    getMeetings(year).catch(() => []),
    getSessions(year).catch(() => []),
  ]);

  if (!meetings.length && !sessions.length) return null;

  const data = { meetings, sessions };
  cache.set(ck, data, 1800); // 30 min
  return data;
}

// GET /api/results/latest
router.get('/latest', async (req, res) => {
  const year     = new Date().getFullYear();
  const cacheKey = `results_latest_${year}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yearData = await getYearData(year);
    if (!yearData) return res.status(503).json({ error: 'OpenF1 unavailable', results: null });

    const { meetings, sessions } = yearData;
    const now = new Date();

    const completedRaces = sessions
      .filter(s => s.session_type === 'Race' && s.session_name === 'Race' && new Date(s.date_end) < now)
      .sort((a, b) => b.date_start.localeCompare(a.date_start));

    if (completedRaces.length === 0)
      return res.json({ message: 'No completed races yet', results: null });

    const lastRace     = completedRaces[0];
    const raceWeekends = meetings
      .filter(m => !m.meeting_name.toLowerCase().includes('testing'))
      .sort((a, b) => a.date_start.localeCompare(b.date_start));
    const round          = raceWeekends.findIndex(m => m.meeting_key === lastRace.meeting_key) + 1;
    const meeting        = raceWeekends[round - 1] || {};
    const meetingSessions = sessions.filter(s => s.meeting_key === lastRace.meeting_key);

    const result = await buildResultsForSession(lastRace.session_key, round, meeting, raceWeekends, meetingSessions);
    if (!result) return res.json({ message: 'Race data not yet available from OpenF1', results: null });
    cache.set(cacheKey, result, 3600);
    res.json(result);
  } catch (err) {
    console.error('[results/latest]', err.message);
    res.status(503).json({ error: 'Results temporarily unavailable', detail: err.message });
  }
});

// GET /api/results/:round — full results for a specific round number
router.get('/:round', async (req, res) => {
  const roundNum = parseInt(req.params.round, 10);
  if (isNaN(roundNum) || roundNum < 1)
    return res.status(400).json({ error: 'Invalid round' });

  const year     = new Date().getFullYear();
  const cacheKey = `results_round_${year}_${roundNum}`;
  const cached   = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const yearData = await getYearData(year);
    if (!yearData) return res.status(503).json({ error: 'OpenF1 unavailable', results: null });

    const { meetings, sessions } = yearData;
    const now = new Date();

    const raceWeekends = meetings
      .filter(m => !m.meeting_name.toLowerCase().includes('testing'))
      .sort((a, b) => a.date_start.localeCompare(b.date_start));

    const meeting = raceWeekends[roundNum - 1];
    if (!meeting) return res.status(404).json({ error: 'Round not found' });

    const raceSession = sessions.find(
      s => s.meeting_key === meeting.meeting_key &&
           s.session_type === 'Race' && s.session_name === 'Race' &&
           new Date(s.date_end) < now
    );
    if (!raceSession)
      return res.json({ round: roundNum, results: null, message: 'Race not yet completed' });

    const meetingSessions = sessions.filter(s => s.meeting_key === meeting.meeting_key);
    const result = await buildResultsForSession(
      raceSession.session_key, roundNum, meeting, raceWeekends, meetingSessions
    );
    if (!result) return res.json({ round: roundNum, message: 'Race data not yet available from OpenF1', results: null });
    cache.set(cacheKey, result, 86400); // 24h — past race data never changes
    res.json(result);
  } catch (err) {
    console.error(`[results/${roundNum}]`, err.message);
    res.status(502).json({ error: 'Failed to fetch round results', detail: err.message });
  }
});

module.exports = router;

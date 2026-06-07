const express = require('express');
const router = express.Router();
const axios = require('axios');
const cache = require('../cache/memoryCache');
const { getMeetings, getSessions, get } = require('../services/openf1');
const { buildAndCacheSchedule } = require('./schedule');

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

// Driver fetch with per-session cache — past sessions never change so 24h TTL is safe.
async function fetchDriversWithCache(sessionKey) {
  const ck = `drivers_session_${sessionKey}`;
  const hit = cache.get(ck);
  if (hit) return hit;
  const drivers = await get('/drivers', { session_key: sessionKey }).catch(() => []);
  if (drivers.length > 0) cache.set(ck, drivers, 86400);
  return drivers;
}

// ── Shared builder — returns the full results object for a given session ───────
// meetingSessions: all sessions for the same meeting, used as fallback for driver lookup
async function buildResultsForSession(sessionKey, round, meeting, raceWeekends, meetingSessions = []) {
  // All calls get .catch(() => []) so a single OpenF1 failure doesn't kill the whole response
  const [positions, laps, intervals] = await Promise.all([
    get('/position', { session_key: sessionKey }).catch(() => []),
    get('/laps',     { session_key: sessionKey }).catch(() => []),
    get('/intervals',{ session_key: sessionKey }).catch(() => []),
  ]);

  // Three-level driver fallback:
  // 1. Race session itself (cached per session_key)
  // 2. Other sessions from the same meeting (qualifying/practice share the same lineup)
  // 3. session_key=latest — last resort when the entire meeting has no driver data yet
  let drivers = await fetchDriversWithCache(sessionKey);

  if (drivers.length === 0 && meetingSessions.length > 0) {
    const SESSION_PRIORITY = { 'Qualifying': 0, 'Sprint Qualifying': 1, 'Sprint': 2,
      'Practice 3': 3, 'Practice 2': 4, 'Practice 1': 5 };
    const fallbacks = meetingSessions
      .filter(s => s.session_key !== sessionKey)
      .sort((a, b) => (SESSION_PRIORITY[a.session_name] ?? 99) - (SESSION_PRIORITY[b.session_name] ?? 99));
    for (const sess of fallbacks) {
      drivers = await fetchDriversWithCache(sess.session_key);
      if (drivers.length > 0) {
        console.log(`[results] driver fallback: meeting session ${sess.session_key} (${sess.session_name})`);
        break;
      }
    }
  }

  if (drivers.length === 0) {
    // Last resort: fetch from the globally latest session OpenF1 has data for.
    // Driver numbers/names are stable across a season so this gives correct identity info.
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

  // Per-driver lap count — used to derive "+X laps" gap when interval data is absent
  const driverLapCounts = new Map();
  for (const lap of laps) {
    const n = lap.lap_number || 0;
    if (n > (driverLapCounts.get(lap.driver_number) || 0))
      driverLapCounts.set(lap.driver_number, n);
  }

  const finalGap = new Map();
  const finalPreceding = new Map();
  for (const iv of intervals) {
    if (iv.gap_to_leader != null)
      finalGap.set(iv.driver_number, iv.gap_to_leader);
    if (iv.gap_to_preceding != null && iv.gap_to_preceding > 0)
      finalPreceding.set(iv.driver_number, iv.gap_to_preceding);
  }

  // OpenF1 often only populates gap_to_leader for P2; for P3+ only gap_to_preceding
  // is reliable. Walk the finishing order and accumulate gap_to_preceding to derive
  // a synthetic gap_to_leader for any driver that doesn't already have one.
  if (finalPreceding.size > 0) {
    const sortedByPos = Array.from(finalPos.entries()).sort((a, b) => a[1] - b[1]);
    let accumulated = 0;
    for (const [driverNum, pos] of sortedByPos) {
      if (pos === 1) { accumulated = 0; continue; }
      const known = finalGap.get(driverNum);
      if (typeof known === 'number') {
        accumulated = known;
      } else {
        const prec = finalPreceding.get(driverNum);
        if (prec !== undefined) {
          accumulated += prec;
          finalGap.set(driverNum, accumulated);
        }
      }
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
      if (pos !== 1) {
        if (typeof rawGap === 'number' && rawGap > 0) {
          gap = `+${rawGap.toFixed(3)}s`;
        } else if (rawGap !== undefined && rawGap !== null && typeof rawGap === 'string') {
          gap = rawGap; // already formatted (e.g. "+1 lap" stored as string)
        } else if (totalLaps !== null) {
          // No interval data — derive gap from lap count
          const dLaps = driverLapCounts.get(num) || 0;
          const diff  = totalLaps - dLaps;
          if (diff > 0)   gap = diff === 1 ? '+1 lap' : `+${diff} laps`;
          else if (dLaps === 0) gap = 'DNF'; // no laps recorded: didn't start or very early retirement
          // diff === 0 and dLaps > 0: finished on lead lap but no timing — gap stays null
        }
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

// ── Jolpica fallback — reliable historical race results ────────────────────────
async function buildResultsFromJolpica(year, round, meeting, totalRounds) {
  const url = `https://api.jolpi.ca/ergast/f1/${year}/${round}/results.json`;
  let data;
  try {
    const resp = await axios.get(url, { timeout: 12000 });
    data = resp.data;
  } catch (err) {
    console.warn(`[results/jolpica] round ${round}: ${err.message}`);
    return null;
  }

  const race = data?.MRData?.RaceTable?.Races?.[0];
  if (!race?.Results?.length) {
    console.warn(`[results/jolpica] round ${round}: no results from Jolpica`);
    return null;
  }
  console.log(`[results/jolpica] round ${round}: ${race.Results.length} entries`);

  let fastestLapAbbreviation = null;
  let fastestLapTime = null;

  const results = race.Results.map(r => {
    const pos          = parseInt(r.position, 10);
    const abbreviation = r.Driver?.code ?? '???';
    const teamName     = r.Constructor?.name ?? 'Unknown';
    const isFastest    = r.FastestLap?.rank === '1';

    if (isFastest) {
      fastestLapAbbreviation = abbreviation;
      fastestLapTime         = r.FastestLap?.Time?.time ?? null;
    }

    let gap = null;
    if (pos > 1) {
      const status = r.status ?? '';
      if (r.Time?.time) {
        // Jolpica gives "+12.345" — normalise to "+12.345s"
        const t = r.Time.time;
        gap = (t.startsWith('+') ? t : `+${t}`) + 's';
      } else if (status.startsWith('+')) {
        gap = status; // "+1 Lap", "+2 Laps"
      } else if (status && status !== 'Finished') {
        gap = status; // "Engine", "Collision", "DNF", etc.
      }
    }

    return {
      driverNumber: parseInt(r.number, 10) || 0,
      abbreviation,
      firstName: r.Driver?.givenName ?? '',
      lastName:  r.Driver?.familyName ?? 'Unknown',
      teamName,
      teamColor: TEAM_COLORS[teamName] || '#8A8A8E',
      flag:      DRIVER_FLAGS[abbreviation] || '🏳️',
      position:  pos,
      points:    parseFloat(r.points) || 0,
      fastestLap: isFastest,
      gap,
    };
  }).sort((a, b) => a.position - b.position);

  return {
    round,
    totalRounds,
    meetingName:            race.raceName ?? meeting?.meeting_name ?? '',
    circuitShortName:       race.Circuit?.circuitName ?? meeting?.circuit_short_name ?? '',
    countryName:            meeting?.country_name ?? '',
    countryCode:            meeting?.country_code ?? '',
    dateStart:              race.date ?? meeting?.date_start ?? '',
    totalLaps:              parseInt(race.Results[0]?.laps, 10) || null,
    fastestLapTime,
    fastestLapAbbreviation,
    results,
  };
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
      .filter(m => !m.meeting_name.toLowerCase().includes('test'))
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

// POST /api/results/cache/clear — invalidate ALL cached rounds for the current year
router.post('/cache/clear', (req, res) => {
  const adminKey = process.env.CACHE_ADMIN_KEY;
  if (adminKey && req.headers['x-admin-key'] !== adminKey)
    return res.status(401).json({ error: 'Unauthorized' });
  const year = new Date().getFullYear();
  const prefix = `results_round_${year}_`;
  const cleared = [];
  for (const key of cache.store.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      cleared.push(key);
    }
  }
  cache.delete(`results_latest_${year}`);
  cleared.push(`results_latest_${year}`);
  console.log(`[results] all round caches cleared: ${cleared.join(', ')}`);
  res.json({ cleared });
});

// POST /api/results/:round/cache/clear — invalidate a single cached round
router.post('/:round/cache/clear', (req, res) => {
  const adminKey = process.env.CACHE_ADMIN_KEY;
  if (adminKey && req.headers['x-admin-key'] !== adminKey)
    return res.status(401).json({ error: 'Unauthorized' });
  const roundNum = parseInt(req.params.round, 10);
  if (isNaN(roundNum)) return res.status(400).json({ error: 'Invalid round' });
  const year = new Date().getFullYear();
  const ck   = `results_round_${year}_${roundNum}`;
  cache.delete(ck);
  console.log(`[results] cache manually cleared for round ${roundNum} (${ck})`);
  res.json({ cleared: ck });
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
    const [schedule, yearData] = await Promise.all([
      buildAndCacheSchedule(year),
      getYearData(year).catch(() => null), // OpenF1 may be blocked during live sessions
    ]);

    if (!schedule)
      return res.status(503).json({ error: 'Schedule unavailable', results: null });

    const now = new Date();

    const scheduleMeeting = schedule.meetings.find(m => m.round === roundNum);
    if (!scheduleMeeting)
      return res.status(404).json({ error: 'Round not found' });
    if (scheduleMeeting.isCancelled)
      return res.status(404).json({ error: 'Race cancelled' });

    const meeting = {
      meeting_name:       scheduleMeeting.meetingName,
      circuit_short_name: scheduleMeeting.circuitShortName,
      country_name:       scheduleMeeting.countryName,
      country_code:       scheduleMeeting.countryCode,
      date_start:         scheduleMeeting.dateStart,
    };

    let result = null;

    // Try OpenF1 only when yearData is available and session has a real key
    if (yearData) {
      const meetingSessions = yearData.sessions.filter(s => s.meeting_key === scheduleMeeting.meetingKey);
      const raceSessionEntry = scheduleMeeting.sessions.find(
        s => s.sessionType === 'Race' && s.sessionName === 'Race' &&
             s.sessionKey && new Date(s.dateEnd || s.dateStart) < now
      );
      if (raceSessionEntry?.sessionKey) {
        result = await buildResultsForSession(
          raceSessionEntry.sessionKey, roundNum, meeting, schedule.meetings, meetingSessions
        );
        if (!result) console.warn(`[results/${roundNum}] OpenF1 returned no data — trying Jolpica`);
      }
    }

    // Jolpica fallback — works independently of OpenF1
    if (!result) {
      result = await buildResultsFromJolpica(year, roundNum, meeting, schedule.meetings.length);
    }

    if (!result)
      return res.json({ round: roundNum, message: 'Race data not yet available', results: null });

    cache.set(cacheKey, result, 21600);
    res.json(result);
  } catch (err) {
    console.error(`[results/${roundNum}]`, err.message);
    res.status(502).json({ error: 'Failed to fetch round results', detail: err.message });
  }
});

module.exports = router;

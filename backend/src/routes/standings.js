const express = require('express');
const router = express.Router();
const memCache  = require('../cache/memoryCache');
const fileCache = require('../cache/fileCache');
const { get } = require('../services/openf1');

const TEAM_COLORS = {
  'McLaren': '#FF8000',
  'Ferrari': '#E8002D',
  'Mercedes': '#27F4D2',
  'Red Bull Racing': '#3671C6',
  'Williams': '#1868DB',
  'Aston Martin': '#229971',
  'RB': '#6692FF',
  'Racing Bulls': '#6692FF',
  'Kick Sauber': '#52E252',
  'Haas F1 Team': '#B6BABD',
  'Alpine': '#00A1E8',
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

const RACE_POINTS   = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

// Manual point corrections for post-race stewards' penalties that OpenF1 live timing
// doesn't reflect (time penalties applied after the chequered flag change official positions
// but not the position stream used above). Update these after each race weekend.
// Key = driver number, value = points delta (positive or negative).
const POINT_CORRECTIONS = {
  2026: {
    16: -4,  // LEC — penalized in some 2026 races, official total 75 vs 79 from timing
    44: +2,  // HAM — promoted by stewards' decisions, official total 72 vs 70 from timing
  },
};

async function buildDriverStandings(year) {
  const now = new Date();

  // Use filtered endpoint — fetch only Race-type sessions for the year.
  // Cache separately so drivers and constructors endpoints share the same fetch.
  const sessionsKey = `race_sessions_${year}`;
  const raceSessions = getCached(sessionsKey)
    || await get('/sessions', { session_type: 'Race', year }).then(d => {
      setCached(sessionsKey, d, 3600);
      return d;
    });

  const completedRaces = raceSessions.filter(
    s => s.session_name === 'Race' && !s.is_cancelled && new Date(s.date_end) < now
  );
  const completedSprints = raceSessions.filter(
    s => s.session_name === 'Sprint' && !s.is_cancelled && new Date(s.date_end) < now
  );

  const driverPoints = new Map();
  const driverInfo   = new Map();

  // Stagger 1500ms between sessions — keeps request rate under 2/s to avoid OpenF1 rate limits.
  // Each session fires position + drivers in parallel (2 concurrent). get() retries 429s automatically.
  const STAGGER_MS = 2000; // 2s between sessions → ~14s for 8 sessions, stays within rate limits

  const allSessions = [
    ...completedRaces.map(s   => ({ ...s, _type: 'race'   })),
    ...completedSprints.map(s => ({ ...s, _type: 'sprint' })),
  ];

  // 2 requests per session (position + drivers), staggered to avoid rate limiting
  const allResults = await Promise.allSettled(
    allSessions.map((session, i) =>
      new Promise(r => setTimeout(r, i * STAGGER_MS))
        .then(() => Promise.all([
          get('/position', { session_key: session.session_key }),
          get('/drivers',  { session_key: session.session_key }),
        ]))
        .then(([positions, drivers]) => ({
          sessionKey: session.session_key,
          positions, drivers,
        }))
    )
  );

  const raceData   = allResults.filter((_, i) => allSessions[i]._type === 'race');
  const sprintData = allResults.filter((_, i) => allSessions[i]._type === 'sprint');

  let scoredCount = 0;

  const scoreResults = (results, pointsSystem) => {
    for (const result of results) {
      if (result.status !== 'fulfilled') {
        console.warn('[standings] session failed:', result.reason?.message);
        continue;
      }
      scoredCount++;
      const { positions, drivers } = result.value;

      for (const d of drivers) {
        if (!driverInfo.has(d.driver_number)) {
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
      }

      // Final position = last recorded entry per driver in this session
      const finalPos = new Map();
      for (const pos of positions) {
        finalPos.set(pos.driver_number, pos.position);
      }

      for (const [dNum, pos] of finalPos) {
        if (!driverPoints.has(dNum)) driverPoints.set(dNum, 0);
        if (pos >= 1 && pos <= pointsSystem.length) {
          driverPoints.set(dNum, driverPoints.get(dNum) + pointsSystem[pos - 1]);
        }
      }

    }
  };

  scoreResults(raceData,   RACE_POINTS);
  scoreResults(sprintData, SPRINT_POINTS);

  // Apply manual corrections for stewards' post-race penalties
  const corrections = POINT_CORRECTIONS[year] || {};
  for (const [driverNum, delta] of Object.entries(corrections)) {
    const num = Number(driverNum);
    if (driverPoints.has(num)) {
      driverPoints.set(num, Math.max(0, driverPoints.get(num) + delta));
    }
  }

  const standings = Array.from(driverPoints.entries())
    .map(([num, pts]) => ({
      ...(driverInfo.get(num) || {
        driverNumber: num, abbreviation: '???', firstName: '', lastName: String(num),
        teamName: 'Unknown', teamColor: '#8A8A8E', flag: '🏳️',
      }),
      points: pts,
    }))
    .sort((a, b) => b.points - a.points)
    .map((d, i) => ({ ...d, position: i + 1 }));

  return { standings, scoredSessions: scoredCount, totalSessions: allSessions.length };
}

// Timeout wrapper — rejects after ms milliseconds
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
  ]);
}

// 3-layer cache lookup: memory → file → null
function getCached(key) {
  return memCache.get(key) || fileCache.get(key) || null;
}

// Save to both caches; file cache persists across server restarts
function setCached(key, value, memTtl, fileTtl = 86400) {
  memCache.set(key, value, memTtl);
  fileCache.set(key, value, fileTtl);
}

// GET /api/standings/drivers
router.get('/drivers', async (req, res) => {
  const year     = new Date().getFullYear();
  const cacheKey = `standings_drivers_${year}`;

  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { standings, scoredSessions, totalSessions } = await withTimeout(buildDriverStandings(year), 30000);
    const result = { season: year, standings };
    const isComplete = scoredSessions === totalSessions && standings.length > 0;
    if (isComplete) setCached(cacheKey, result, 3600);   // full data → persist
    else memCache.set(cacheKey, result, 30);              // partial → retry in 30s, no disk
    console.log(`[standings/drivers] ${scoredSessions}/${totalSessions} sessions scored, cached=${isComplete}`);
    res.json(result);
  } catch (err) {
    console.error('[standings/drivers]', err.message);
    // Fall back to stale file cache rather than returning an error
    const stale = fileCache.get(cacheKey);
    if (stale) return res.json(stale);
    res.status(502).json({ error: 'Failed to fetch driver standings', detail: err.message });
  }
});

// GET /api/standings/constructors
router.get('/constructors', async (req, res) => {
  const year     = new Date().getFullYear();
  const cacheKey = `standings_constructors_${year}`;

  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const { standings: driverStandings, scoredSessions, totalSessions } = await withTimeout(buildDriverStandings(year), 30000);
    const constructorMap  = new Map();

    for (const driver of driverStandings) {
      const key = driver.teamName;
      if (!constructorMap.has(key)) {
        constructorMap.set(key, {
          teamName:  driver.teamName,
          teamColor: driver.teamColor,
          points:    0,
          drivers:   [],
        });
      }
      const c = constructorMap.get(key);
      c.points += driver.points;
      c.drivers.push(driver.abbreviation);
    }

    const standings = Array.from(constructorMap.values())
      .sort((a, b) => b.points - a.points)
      .map((c, i) => ({ ...c, position: i + 1 }));

    const result = { season: year, standings };
    const isComplete = scoredSessions === totalSessions && standings.length > 0;
    if (isComplete) setCached(cacheKey, result, 3600);
    else memCache.set(cacheKey, result, 30);
    res.json(result);
  } catch (err) {
    console.error('[standings/constructors]', err.message);
    const stale = fileCache.get(cacheKey);
    if (stale) return res.json(stale);
    res.status(502).json({ error: 'Failed to fetch constructor standings', detail: err.message });
  }
});

module.exports = router;

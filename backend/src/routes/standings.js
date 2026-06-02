const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const fs       = require('fs');
const path     = require('path');
const memCache = require('../cache/memoryCache');

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const CACHE_TTL    = 86400; // 24 h — standings only change after each race; long TTL keeps data during Jolpica outages

const FALLBACK_DIR = path.join(__dirname, '../../../cache');

function readFallback(filename) {
  try {
    return JSON.parse(fs.readFileSync(path.join(FALLBACK_DIR, filename), 'utf8'));
  } catch {
    return null;
  }
}

function writeFallback(filename, data) {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) fs.mkdirSync(FALLBACK_DIR, { recursive: true });
    fs.writeFileSync(path.join(FALLBACK_DIR, filename), JSON.stringify(data), 'utf8');
  } catch (e) {
    console.warn('[standings] fallback write failed:', e.message);
  }
}

async function jolpica(path) {
  const { data } = await axios.get(`${JOLPICA_BASE}/${path}`, { timeout: 10000 });
  return data?.MRData ?? null;
}

// In-flight dedup — prevents duplicate Jolpica requests when both endpoints are hit simultaneously
const inFlight = new Map();

function dedupe(key, fn) {
  if (inFlight.has(key)) return inFlight.get(key);
  const p = fn().finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}

async function buildDriverStandings(year) {
  return dedupe(`drv_${year}`, async () => {
    const mr   = await jolpica(`${year}/driverStandings.json`);
    const list = mr?.StandingsTable?.StandingsLists?.[0]?.DriverStandings;
    if (!list?.length) throw new Error('No driver standings from Jolpica');

    return list.map(e => ({
      position:     parseInt(e.position, 10),
      driverNumber: parseInt(e.Driver.permanentNumber, 10) || null,
      abbreviation: e.Driver.code ?? '',
      firstName:    e.Driver.givenName ?? '',
      lastName:     e.Driver.familyName ?? '',
      teamName:     e.Constructors?.[0]?.name ?? 'Unknown',
      points:       parseFloat(e.points),
    }));
  });
}

async function buildConstructorStandings(year) {
  return dedupe(`con_${year}`, async () => {
    // Reuse in-flight driver call (if warm-up fired both simultaneously, only one Jolpica request goes out)
    const [ctorMr, drivers] = await Promise.all([
      jolpica(`${year}/constructorStandings.json`),
      buildDriverStandings(year),
    ]);

    const list = ctorMr?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings;
    if (!list?.length) throw new Error('No constructor standings from Jolpica');

    // Build team → [driver abbreviations] from driver standings
    const driversByTeam = new Map();
    for (const d of drivers) {
      if (!driversByTeam.has(d.teamName)) driversByTeam.set(d.teamName, []);
      driversByTeam.get(d.teamName).push(d.abbreviation);
    }

    return list.map(e => ({
      position: parseInt(e.position, 10),
      teamName: e.Constructor.name,
      points:   parseFloat(e.points),
      drivers:  driversByTeam.get(e.Constructor.name) ?? [],
    }));
  });
}

// GET /api/standings/drivers
router.get('/drivers', async (req, res) => {
  const year = new Date().getFullYear();
  const ck   = `standings_drivers_${year}`;
  const hit  = memCache.get(ck);
  if (hit) return res.json(hit);

  try {
    const standings = await buildDriverStandings(year);
    const result    = { season: year, standings };
    memCache.set(ck, result, CACHE_TTL);
    writeFallback('standings-drivers.json', result);
    console.log(`[standings/drivers] ${standings.length} drivers cached`);
    res.json(result);
  } catch (err) {
    console.error('[standings/drivers] Jolpica failed:', err.message);
    const stale = readFallback('standings-drivers.json');
    if (stale) {
      console.warn('[standings/drivers] serving stale fallback');
      return res.set('X-Cache', 'stale').json(stale);
    }
    res.status(503).json({ error: 'Standings unavailable — Jolpica is down and no cached data exists' });
  }
});

// GET /api/standings/constructors
router.get('/constructors', async (req, res) => {
  const year = new Date().getFullYear();
  const ck   = `standings_constructors_${year}`;
  const hit  = memCache.get(ck);
  if (hit) return res.json(hit);

  try {
    const standings = await buildConstructorStandings(year);
    const result    = { season: year, standings };
    memCache.set(ck, result, CACHE_TTL);
    writeFallback('standings-constructors.json', result);
    console.log(`[standings/constructors] ${standings.length} constructors cached`);
    res.json(result);
  } catch (err) {
    console.error('[standings/constructors] Jolpica failed:', err.message);
    const stale = readFallback('standings-constructors.json');
    if (stale) {
      console.warn('[standings/constructors] serving stale fallback');
      return res.set('X-Cache', 'stale').json(stale);
    }
    res.status(503).json({ error: 'Standings unavailable — Jolpica is down and no cached data exists' });
  }
});

async function warmUpStandings() {
  const year   = new Date().getFullYear();
  const drvKey = `standings_drivers_${year}`;
  const conKey = `standings_constructors_${year}`;
  if (memCache.get(drvKey) && memCache.get(conKey)) return;

  console.log('[warmup] fetching standings from Jolpica...');
  try {
    // Both run in parallel; buildConstructorStandings reuses the driver in-flight call
    const [drivers, constructors] = await Promise.all([
      buildDriverStandings(year),
      buildConstructorStandings(year),
    ]);
    const drvResult = { season: year, standings: drivers };
    const conResult = { season: year, standings: constructors };
    memCache.set(drvKey, drvResult, CACHE_TTL);
    memCache.set(conKey, conResult, CACHE_TTL);
    writeFallback('standings-drivers.json', drvResult);
    writeFallback('standings-constructors.json', conResult);
    console.log(`[warmup] standings ready — ${drivers.length} drivers, ${constructors.length} constructors`);
  } catch (err) {
    // Don't write stale/partial data — let the first request trigger a fresh fetch
    console.warn('[warmup] standings failed — cache left empty:', err.message);
  }
}

module.exports = router;
module.exports.warmUpStandings = warmUpStandings;

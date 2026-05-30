const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const memCache = require('../cache/memoryCache');

const JOLPICA_BASE = 'https://api.jolpi.ca/ergast/f1';
const CACHE_TTL    = 1800; // 30 min — official standings only change after each race

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
    console.log(`[standings/drivers] ${standings.length} drivers cached`);
    res.json(result);
  } catch (err) {
    console.error('[standings/drivers]', err.message);
    res.status(502).json({ error: 'Failed to fetch driver standings', detail: err.message });
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
    console.log(`[standings/constructors] ${standings.length} constructors cached`);
    res.json(result);
  } catch (err) {
    console.error('[standings/constructors]', err.message);
    res.status(502).json({ error: 'Failed to fetch constructor standings', detail: err.message });
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
    memCache.set(drvKey, { season: year, standings: drivers },       CACHE_TTL);
    memCache.set(conKey, { season: year, standings: constructors },  CACHE_TTL);
    console.log(`[warmup] standings ready — ${drivers.length} drivers, ${constructors.length} constructors`);
  } catch (err) {
    // Don't write stale/partial data — let the first request trigger a fresh fetch
    console.warn('[warmup] standings failed — cache left empty:', err.message);
  }
}

module.exports = router;
module.exports.warmUpStandings = warmUpStandings;

const express = require('express');
const router = express.Router();
const cache = require('../cache/memoryCache');
const { get } = require('../services/openf1');

// ── OpenF1 circuit_short_name candidates per circuit key ─────────────────────
// Multiple names tried in order because OpenF1 uses different values over years.
const CIRCUIT_NAMES = {
  monaco:        ['Monaco', 'Monte Carlo'],
  barcelona:     ['Barcelona', 'Catalunya'],
  silverstone:   ['Silverstone'],
  monza:         ['Monza'],
  spa:           ['Spa-Francorchamps'],
  zandvoort:     ['Zandvoort'],
  hungaroring:   ['Hungaroring'],
  albert_park:   ['Melbourne', 'Albert Park'],
  shanghai:      ['Shanghai'],
  suzuka:        ['Suzuka'],
  bahrain:       ['Sakhir', 'Bahrain'],
  jeddah:        ['Jeddah'],
  miami:         ['Miami'],
  imola:         ['Imola'],
  red_bull_ring: ['Spielberg', 'Red Bull Ring'],
  baku:          ['Baku'],
  marina_bay:    ['Singapore', 'Marina Bay'],
  cota:          ['Austin', 'COTA'],
  rodriguez:     ['Mexico City'],
  interlagos:    ['Interlagos', 'São Paulo', 'Sao Paulo'],
  las_vegas:     ['Las Vegas'],
  lusail:        ['Lusail'],
  yas_marina:    ['Yas Marina'],
  villeneuve:    ['Montreal', 'Gilles Villeneuve'],
};

// ── Find a valid P1 session key from OpenF1 (cached 7 days) ──────────────────
async function findSessionKey(circuitKey) {
  const cacheKey = `session_key_v2_${circuitKey}`;
  const hit = cache.get(cacheKey);
  if (hit) return hit;

  const names = CIRCUIT_NAMES[circuitKey];
  if (!names) return null;

  for (const year of [2024, 2023]) {
    for (const name of names) {
      try {
        const sessions = await get('/sessions', {
          year,
          circuit_short_name: name,
          session_name: 'Practice 1',
        });
        if (Array.isArray(sessions) && sessions.length > 0) {
          const key = sessions[0].session_key;
          console.log(`[circuit-map] ${circuitKey}: found session ${key} (${name} ${year} P1)`);
          cache.set(cacheKey, key, 86400 * 7);
          return key;
        }
      } catch {
        // try next name/year
      }
    }
  }

  console.warn(`[circuit-map] ${circuitKey}: no OpenF1 session found`);
  return null;
}

// GET /api/circuit-map/:circuitKey
router.get('/:circuitKey', async (req, res) => {
  const { circuitKey } = req.params;

  if (!CIRCUIT_NAMES[circuitKey]) {
    return res.status(404).json({ error: `Unknown circuit: ${circuitKey}` });
  }

  const svgCacheKey = `circuit_map_v4_${circuitKey}`;
  const cachedSvg = cache.get(svgCacheKey);
  if (cachedSvg) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(cachedSvg);
  }

  try {
    const sessionKey = await findSessionKey(circuitKey);
    if (!sessionKey) {
      return res.status(404).json({ error: `No session data for circuit: ${circuitKey}` });
    }

    const DRIVERS = [1, 16, 11, 44, 63, 4, 55, 14, 81, 22];
    let points = null;

    for (const dnum of DRIVERS) {
      // Try clean single-lap first (best quality)
      points = await fetchCleanLap(sessionKey, dnum);
      if (points && points.length >= 80) break;

      // Fall back to raw session data for this driver
      if (!points || points.length < 80) {
        const raw = await fetchRawLocation(sessionKey, dnum);
        if (raw && raw.length >= 80) { points = raw; break; }
      }
    }

    if (!points || points.length < 50) {
      console.warn(`[circuit-map] ${circuitKey}: insufficient points (${points?.length ?? 0})`);
      return res.status(502).json({ error: 'Insufficient GPS data for circuit' });
    }

    const svg = buildSvg(points);
    cache.set(svgCacheKey, svg, 86400);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (err) {
    console.error(`[circuit-map] ${circuitKey}:`, err.message);
    res.status(502).json({ error: 'Failed to generate circuit map', detail: err.message });
  }
});

// ── Fetch one clean lap of GPS points ────────────────────────────────────────
async function fetchCleanLap(sessionKey, driverNumber) {
  try {
    const laps = await get('/laps', { session_key: sessionKey, driver_number: driverNumber });
    if (!Array.isArray(laps) || laps.length < 3) return null;

    // Skip outlap (lap 1); prefer lap 4 > lap 3 > any lap after 2
    const targetLap =
      laps.find(l => l.lap_number === 4) ||
      laps.find(l => l.lap_number === 3) ||
      laps.find(l => l.lap_number > 2);
    if (!targetLap?.date_start) return null;

    const lapStart  = new Date(targetLap.date_start).getTime();
    const durationMs = (targetLap.lap_duration ?? 130) * 1000;
    const lapEnd    = lapStart + durationMs + 3000;

    const allLoc = await get('/location', { session_key: sessionKey, driver_number: driverNumber });
    if (!Array.isArray(allLoc) || allLoc.length === 0) return null;

    const lapPoints = allLoc.filter(p => {
      const t = new Date(p.date).getTime();
      return t >= lapStart && t <= lapEnd && p.x != null && p.y != null;
    });

    if (lapPoints.length < 50) return null;
    return lapPoints.map(p => ({ x: p.x, y: p.y }));
  } catch {
    return null;
  }
}

// ── Fallback: first lap of session location data, downsampled ────────────────
async function fetchRawLocation(sessionKey, driverNumber) {
  try {
    const data = await get('/location', { session_key: sessionKey, driver_number: driverNumber });
    if (!Array.isArray(data) || data.length === 0) return null;
    // Keep every 12th point, then cut to ~one lap to avoid overlapping traces
    const sampled = data
      .filter((_, i) => i % 12 === 0)
      .map(p => ({ x: p.x, y: p.y }))
      .filter(p => p.x != null && p.y != null);
    return sliceOneLap(sampled);
  } catch {
    return null;
  }
}

// Truncates a GPS point array to approximately one lap by detecting when the
// path returns close to the starting position. Without this, multi-lap session
// data causes the circuit shape to be drawn repeatedly with slight GPS offsets,
// producing visible overlapping lines in the SVG output.
function sliceOneLap(points) {
  if (points.length < 30) return points;
  const sx = points[0].x, sy = points[0].y;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  const spread = Math.max(
    Math.max(...xs) - Math.min(...xs),
    Math.max(...ys) - Math.min(...ys),
  ) || 100;
  const threshold = spread * 0.06;
  const minIdx = Math.floor(points.length * 0.15);
  for (let i = minIdx; i < points.length; i++) {
    const dx = points[i].x - sx, dy = points[i].y - sy;
    if (Math.sqrt(dx * dx + dy * dy) < threshold) return points.slice(0, i + 1);
  }
  return points;
}

// ── Point processing ──────────────────────────────────────────────────────────
function deduplicate(points, minDist = 1.5) {
  if (points.length === 0) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const last = result[result.length - 1];
    const dx = points[i].x - last.x;
    const dy = points[i].y - last.y;
    if (Math.sqrt(dx * dx + dy * dy) >= minDist) result.push(points[i]);
  }
  return result;
}

function chaikin(points, iterations = 3) {
  let pts = points;
  for (let iter = 0; iter < iterations; iter++) {
    const smoothed = [];
    for (let i = 0; i < pts.length - 1; i++) {
      smoothed.push({
        x: 0.75 * pts[i].x + 0.25 * pts[i + 1].x,
        y: 0.75 * pts[i].y + 0.25 * pts[i + 1].y,
      });
      smoothed.push({
        x: 0.25 * pts[i].x + 0.75 * pts[i + 1].x,
        y: 0.25 * pts[i].y + 0.75 * pts[i + 1].y,
      });
    }
    pts = smoothed;
  }
  return pts;
}

function normalize(points, W, H, PAD) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale  = Math.min((W - PAD * 2) / rangeX, (H - PAD * 2) / rangeY);
  const offsetX = PAD + ((W - PAD * 2) - rangeX * scale) / 2;
  const offsetY = PAD + ((H - PAD * 2) - rangeY * scale) / 2;
  return points.map(p => ({
    x: (p.x - minX) * scale + offsetX,
    y: (p.y - minY) * scale + offsetY,
  }));
}

function pointsToPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length - 2; i++) {
    const cpx = ((points[i].x + points[i + 1].x) / 2).toFixed(1);
    const cpy = ((points[i].y + points[i + 1].y) / 2).toFixed(1);
    d += ` Q ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)} ${cpx} ${cpy}`;
  }
  d += ' Z';
  return d;
}

function buildSvg(rawPoints) {
  const W = 400, H = 280, PAD = 30;
  const deduped  = deduplicate(rawPoints, 1.5);
  const normed   = normalize(deduped, W, H, PAD);
  const clean    = deduplicate(normed, 2);
  const smoothed = chaikin(clean, 3);
  const pathD    = pointsToPath(smoothed);

  const p0 = smoothed[0];
  const p1 = smoothed[1] || { x: p0.x + 1, y: p0.y };
  const perp = Math.atan2(p1.y - p0.y, p1.x - p0.x) + Math.PI / 2;
  const sfX1 = (p0.x + Math.cos(perp) * 6).toFixed(1);
  const sfY1 = (p0.y + Math.sin(perp) * 6).toFixed(1);
  const sfX2 = (p0.x - Math.cos(perp) * 6).toFixed(1);
  const sfY2 = (p0.y - Math.sin(perp) * 6).toFixed(1);

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathD}" fill="none" stroke="#E10600" stroke-width="10" stroke-opacity="0.12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${pathD}" fill="none" stroke="#E10600" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${sfX1}" y1="${sfY1}" x2="${sfX2}" y2="${sfY2}" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
}

module.exports = router;

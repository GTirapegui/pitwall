const express   = require('express');
const router    = express.Router();
const cache     = require('../cache/memoryCache');
const fileCache = require('../cache/fileCache');
const { get }   = require('../services/openf1');

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

// ── Find a valid P1 session key from OpenF1 (persisted to disk — never changes) ──
async function findSessionKey(circuitKey) {
  const memKey  = `session_key_v2_${circuitKey}`;
  const fileKey = `session_key_${circuitKey}`;

  const inMem = cache.get(memKey);
  if (inMem) return inMem;

  const onDisk = fileCache.get(fileKey);
  if (onDisk) {
    cache.set(memKey, onDisk, 86400 * 7);
    return onDisk;
  }

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
          cache.set(memKey, key, 86400 * 7);
          fileCache.set(fileKey, key, 365 * 24 * 3600); // permanent — historical keys never change
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

  const svgMemKey  = `circuit_map_v8_${circuitKey}`;
  const svgFileKey = `circuit_svg_${circuitKey}`;

  const cachedSvg = cache.get(svgMemKey) ?? fileCache.get(svgFileKey);
  if (cachedSvg) {
    if (!cache.get(svgMemKey)) cache.set(svgMemKey, cachedSvg, 86400);
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
      points = await fetchPoints(sessionKey, dnum);
      if (points && points.length >= 20) break;
    }

    if (!points || points.length < 20) {
      console.warn(`[circuit-map] ${circuitKey}: insufficient points (${points?.length ?? 0})`);
      return res.status(502).json({ error: 'Insufficient GPS data for circuit' });
    }

    const svg = buildSvg(points);
    cache.set(svgMemKey, svg, 86400);
    fileCache.set(svgFileKey, svg, 365 * 24 * 3600); // permanent — GPS data never changes

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (err) {
    console.error(`[circuit-map] ${circuitKey}:`, err.message);
    res.status(502).json({ error: 'Failed to generate circuit map', detail: err.message });
  }
});

// ── Fetch GPS points for exactly one lap ─────────────────────────────────────
// Fetches laps + location in parallel (one API round-trip per driver).
// Uses lap timestamps to isolate exactly one lap from the location stream.
// This is the only safe way to avoid multi-lap overlapping traces: the
// location stream for a full P1 session contains 10-20 laps at slightly
// different GPS offsets, which render as visually overlapping lines.
//
// Priority: lap 3 → lap 4 → lap 2 → any lap after 1 → fixed raw slice.
async function fetchPoints(sessionKey, driverNumber) {
  try {
    const [laps, allLoc] = await Promise.all([
      get('/laps',     { session_key: sessionKey, driver_number: driverNumber }),
      get('/location', { session_key: sessionKey, driver_number: driverNumber }),
    ]);

    if (!Array.isArray(allLoc) || allLoc.length === 0) return null;

    // Use lap timing to slice exactly one lap out of the location stream
    if (Array.isArray(laps) && laps.length >= 2) {
      const PREFERRED = [3, 4, 2];
      const candidates = [
        ...PREFERRED.map(n => laps.find(l => l.lap_number === n)),
        laps.find(l => l.lap_number > 1 && !PREFERRED.includes(l.lap_number)),
      ].filter(Boolean);

      for (const lap of candidates) {
        if (!lap?.date_start) continue;
        const t0  = new Date(lap.date_start).getTime();
        const dur = (lap.lap_duration ?? 130) * 1000;
        const pts = allLoc
          .filter(p => {
            const t = new Date(p.date).getTime();
            return t >= t0 && t <= t0 + dur + 500 && p.x != null && p.y != null;
          })
          .map(p => ({ x: p.x, y: p.y }));
        if (pts.length >= 30) return pts;
      }
    }

    // Last resort: skip pit lane exit (~50 pts at ~3.7 Hz) then take a fixed
    // window of ~480 points ≈ one lap. Never use the full session stream.
    const pts = allLoc
      .slice(50, 530)
      .map(p => ({ x: p.x, y: p.y }))
      .filter(p => p.x != null && p.y != null);
    return pts.length >= 20 ? pts : null;
  } catch {
    return null;
  }
}

// ── Point processing ──────────────────────────────────────────────────────────

// Removes GPS spike points (outliers >8× the median consecutive step).
// Confirmed cause of "lines that don't go anywhere": Monaco lap 3 had spikes
// of 638, 300, 292, 260 units vs. a typical step of ~12 units.
function filterSpikes(points) {
  if (points.length < 5) return points;
  const dists = [];
  for (let i = 1; i < points.length; i++) {
    dists.push(Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y));
  }
  const sorted = [...dists].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const threshold = median * 8;
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (dists[i - 1] <= threshold) result.push(points[i]);
  }
  return result;
}

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

// Ramer-Douglas-Peucker: removes GPS noise while preserving corner shape
function rdpSimplify(pts, epsilon) {
  if (pts.length <= 2) return pts;
  const first = pts[0], last = pts[pts.length - 1];
  const dx = last.x - first.x, dy = last.y - first.y;
  const len = Math.hypot(dx, dy);
  let maxDist = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const dist = len < 1e-10
      ? Math.hypot(pts[i].x - first.x, pts[i].y - first.y)
      : Math.abs(dy * pts[i].x - dx * pts[i].y + last.x * first.y - last.y * first.x) / len;
    if (dist > maxDist) { maxDist = dist; idx = i; }
  }
  if (maxDist > epsilon) {
    const l = rdpSimplify(pts.slice(0, idx + 1), epsilon);
    const r = rdpSimplify(pts.slice(idx), epsilon);
    return [...l.slice(0, -1), ...r];
  }
  return [first, last];
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
    y: H - ((p.y - minY) * scale + offsetY), // flip Y: GPS Y increases up, SVG Y increases down
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
  const filtered   = filterSpikes(rawPoints);      // remove GPS outlier spikes first
  const deduped    = deduplicate(filtered, 1.5);
  const normed     = normalize(deduped, W, H, PAD);
  const simplified = rdpSimplify(normed, 2.5);
  const clean      = deduplicate(simplified, 2);
  const smoothed   = chaikin(clean, 3);
  const pathD      = pointsToPath(smoothed);

  const p0 = smoothed[0];
  const p1 = smoothed[1] || { x: p0.x + 1, y: p0.y };
  const perp = Math.atan2(p1.y - p0.y, p1.x - p0.x) + Math.PI / 2;
  const sfX1 = (p0.x + Math.cos(perp) * 6).toFixed(1);
  const sfY1 = (p0.y + Math.sin(perp) * 6).toFixed(1);
  const sfX2 = (p0.x - Math.cos(perp) * 6).toFixed(1);
  const sfY2 = (p0.y - Math.sin(perp) * 6).toFixed(1);

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathD}" fill="none" stroke="#E10600" stroke-width="6" stroke-opacity="0.10" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${pathD}" fill="none" stroke="#E10600" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="${sfX1}" y1="${sfY1}" x2="${sfX2}" y2="${sfY2}" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
}

module.exports = router;

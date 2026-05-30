const express = require('express');
const router = express.Router();
const cache = require('../cache/memoryCache');
const { get } = require('../services/openf1');

const SESSION_KEYS = {
  monaco:        9860,
  barcelona:     9889,
  silverstone:   9910,
  monza:         9930,
  spa:           9906,
  zandvoort:     9921,
  hungaroring:   9915,
  albert_park:   9472,
  suzuka:        9479,
  bahrain:       9468,
  jeddah:        9475,
  miami:         9483,
  imola:         9486,
  red_bull_ring: 9904,
  baku:          9894,
  marina_bay:    9935,
  cota:          9940,
  rodriguez:     9945,
  interlagos:    9948,
  las_vegas:     9951,
  lusail:        9954,
  yas_marina:    9957,
  villeneuve:    9897,
  shanghai:      9480,
};

// GET /api/circuit-map/:circuitKey
router.get('/:circuitKey', async (req, res) => {
  const { circuitKey } = req.params;
  const sessionKey = SESSION_KEYS[circuitKey];

  if (!sessionKey) {
    return res.status(404).json({ error: `No session key for circuit: ${circuitKey}` });
  }

  const cacheKey = `circuit_map_v2_${circuitKey}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(cached);
  }

  try {
    const DRIVER_CANDIDATES = [1, 16, 11, 44, 63, 4, 55, 14];
    let points = null;

    for (const dnum of DRIVER_CANDIDATES) {
      points = await fetchCleanLap(sessionKey, dnum);
      if (points && points.length >= 80) break;
    }

    if (!points || points.length < 50) {
      return res.status(502).json({ error: 'Insufficient location data for circuit' });
    }

    const svg = buildSvg(points);
    cache.set(cacheKey, svg, 86400);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(svg);
  } catch (err) {
    console.error(`[circuit-map] ${circuitKey}:`, err.message);
    res.status(502).json({ error: 'Failed to generate circuit map', detail: err.message });
  }
});

// ── Fetch one clean lap worth of GPS points ──────────────────────────────────

async function fetchCleanLap(sessionKey, driverNumber) {
  try {
    // Get laps to find a representative in-lap (skip lap 1 = outlap)
    const laps = await get('/laps', { session_key: sessionKey, driver_number: driverNumber });
    if (!Array.isArray(laps) || laps.length < 3) return null;

    // Pick lap 3 or 4 — past the outlap, usually representative
    const targetLap = laps.find(l => l.lap_number === 4) || laps.find(l => l.lap_number === 3) || laps[2];
    if (!targetLap?.date_start) return null;

    const lapStart = new Date(targetLap.date_start).getTime();
    // lap_duration is in seconds; add a small buffer
    const durationMs = (targetLap.lap_duration ?? 120) * 1000;
    const lapEnd = lapStart + durationMs + 2000;

    // Fetch all location data for this driver
    const allLoc = await get('/location', { session_key: sessionKey, driver_number: driverNumber });
    if (!Array.isArray(allLoc) || allLoc.length === 0) return null;

    // Filter to only this lap's timeframe
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

// ── Point processing pipeline ─────────────────────────────────────────────────

function deduplicate(points, minDist = 1.5) {
  if (points.length === 0) return points;
  const result = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const last = result[result.length - 1];
    const dx = points[i].x - last.x;
    const dy = points[i].y - last.y;
    if (Math.sqrt(dx * dx + dy * dy) >= minDist) {
      result.push(points[i]);
    }
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

  const scaleX = (W - PAD * 2) / rangeX;
  const scaleY = (H - PAD * 2) / rangeY;
  const scale  = Math.min(scaleX, scaleY);

  // Center within padded area
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

// ── SVG builder ───────────────────────────────────────────────────────────────

function buildSvg(rawPoints) {
  const W = 400, H = 280, PAD = 30;

  // 1. Deduplicate raw GPS noise
  const deduped = deduplicate(rawPoints, 1.5);

  // 2. Normalize to viewport coordinates
  const normed = normalize(deduped, W, H, PAD);

  // 3. Deduplicate again after normalization (catches close points at pixel scale)
  const clean = deduplicate(normed, 2);

  // 4. Chaikin smoothing — 3 iterations
  const smoothed = chaikin(clean, 3);

  // 5. Build quadratic bezier path
  const pathD = pointsToPath(smoothed);

  // 6. Start/finish marker — perpendicular rect at point[0]
  const p0 = smoothed[0];
  const p1 = smoothed[1] || { x: p0.x + 1, y: p0.y };
  const angle = Math.atan2(p1.y - p0.y, p1.x - p0.x);
  const perpAngle = angle + Math.PI / 2;
  const sfLen = 6;
  const sfX1 = (p0.x + Math.cos(perpAngle) * sfLen).toFixed(1);
  const sfY1 = (p0.y + Math.sin(perpAngle) * sfLen).toFixed(1);
  const sfX2 = (p0.x - Math.cos(perpAngle) * sfLen).toFixed(1);
  const sfY2 = (p0.y - Math.sin(perpAngle) * sfLen).toFixed(1);

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <!-- glow -->
  <path d="${pathD}" fill="none" stroke="#E10600" stroke-width="10" stroke-opacity="0.12" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- track -->
  <path d="${pathD}" fill="none" stroke="#E10600" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- start/finish line -->
  <line x1="${sfX1}" y1="${sfY1}" x2="${sfX2}" y2="${sfY2}" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;
}

module.exports = router;

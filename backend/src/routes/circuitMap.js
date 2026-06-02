const express = require('express');
const router  = require('express').Router();
const axios   = require('axios');
const cache   = require('../cache/memoryCache');

// Maps app circuit keys → current-season layout IDs from julesr0y/f1-circuits-svg
// Source: https://github.com/julesr0y/f1-circuits-svg (CC BY 4.0 — Jules ROY)
const CIRCUIT_LAYOUT = {
  monaco:        'monaco-6',
  silverstone:   'silverstone-8',
  monza:         'monza-7',
  spa:           'spa-francorchamps-4',
  zandvoort:     'zandvoort-5',
  hungaroring:   'hungaroring-3',
  albert_park:   'melbourne-2',
  shanghai:      'shanghai-1',
  suzuka:        'suzuka-2',
  bahrain:       'bahrain-1',
  jeddah:        'jeddah-1',
  miami:         'miami-1',
  imola:         'imola-3',
  red_bull_ring: 'spielberg-3',
  baku:          'baku-1',
  marina_bay:    'marina-bay-4',
  cota:          'austin-1',
  rodriguez:     'mexico-city-3',
  interlagos:    'interlagos-2',
  las_vegas:     'las-vegas-1',
  lusail:        'lusail-1',
  yas_marina:    'yas-marina-2',
  villeneuve:    'montreal-6',
};

const SVG_BASE = 'https://raw.githubusercontent.com/julesr0y/f1-circuits-svg/main/circuits/minimal/black';
const CACHE_TTL = 86400 * 7; // 7 days — static assets don't change

// GET /api/circuit-map/:circuitKey
router.get('/:circuitKey', async (req, res) => {
  const { circuitKey } = req.params;
  const layoutId = CIRCUIT_LAYOUT[circuitKey];

  if (!layoutId) {
    return res.status(404).json({ error: `Unknown circuit: ${circuitKey}` });
  }

  const cacheKey = `circuit_static_v1_${circuitKey}`;
  const cached   = cache.get(cacheKey);
  if (cached) {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    return res.send(cached);
  }

  try {
    const url = `${SVG_BASE}/${layoutId}.svg`;
    const { data: rawSvg } = await axios.get(url, { timeout: 8000, responseType: 'text' });

    const svg = restyle(rawSvg);
    cache.set(cacheKey, svg, CACHE_TTL);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(svg);
  } catch (err) {
    console.error(`[circuit-map] ${circuitKey}:`, err.message);
    res.status(502).json({ error: 'Failed to fetch circuit SVG', detail: err.message });
  }
});

// Extract the path `d` attribute from the source SVG and rebuild with Pitwall styling.
// Source SVGs are 500×500 with a single black path (stroke-width:20).
// We render two layers: a wide low-opacity glow + a thinner solid red line.
function restyle(rawSvg) {
  const match = rawSvg.match(/\bd="([^"]+)"/);
  if (!match) return rawSvg; // fallback: serve as-is if parsing fails

  const pathD = match[1];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
  <path d="${pathD}" fill="none" stroke="#E10600" stroke-width="16" stroke-opacity="0.12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${pathD}" fill="none" stroke="#E10600" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

module.exports = router;

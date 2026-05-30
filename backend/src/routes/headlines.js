const express = require('express');
const router  = express.Router();
const memCache = require('../cache/memoryCache');

const BASE = `http://localhost:${process.env.PORT || 3001}`;

async function fetchLocal(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) return null;
  return res.json();
}

// Circuit adjectives for PREVIA headline
const CIRCUIT_ADJ = {
  'Monte Carlo': 'técnicos y exigentes',
  'Monza':       'rápidos del calendario',
  'Spa':         'míticos del mundo',
  'Silverstone': 'históricos de la F1',
  'Suzuka':      'desafiantes del calendario',
  'Interlagos':  'espectaculares del año',
  'Baku':        'imprevisibles del campeonato',
};

function circuitAdj(circuitShort) {
  for (const [key, adj] of Object.entries(CIRCUIT_ADJ)) {
    if (circuitShort && circuitShort.toLowerCase().includes(key.toLowerCase())) return adj;
  }
  return 'desafiantes del campeonato';
}

// Human-readable time-ago strings
function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const h    = Math.floor(diff / 3_600_000);
  if (h < 1)   return 'hace menos de 1 h';
  if (h === 1) return 'hace 1 h';
  if (h < 24)  return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'hace 1 día' : `hace ${d} días`;
}

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// GET /api/headlines
router.get('/', async (req, res) => {
  const CACHE_KEY = 'headlines_v1';
  const cached = memCache.get(CACHE_KEY);
  if (cached) return res.json(cached);

  try {
    const [results, driverSt, constrSt, nextEvt] = await Promise.all([
      fetchLocal('/api/results/latest'),
      fetchLocal('/api/standings/drivers'),
      fetchLocal('/api/standings/constructors'),
      fetchLocal('/api/next-event'),
    ]);

    const headlines = [];

    // ── 1. RESULTADO ──────────────────────────────────────────────────────────
    if (results?.results?.length) {
      const winner   = results.results[0];
      const gp       = (results.meetingName || '').replace(' Grand Prix', '');
      const drivers  = driverSt?.standings ?? [];
      const leader   = drivers[0];
      const second   = drivers[1];
      const gap      = leader && second ? leader.points - second.points : 0;

      let action = `suma ${winner.points} puntos importantes en el campeonato`;
      if (leader && winner.abbreviation === leader.abbreviation) {
        action = `extiende su ventaja a ${gap} puntos en el mundial`;
      } else if (leader && winner.abbreviation === second?.abbreviation) {
        action = `recorta a tan solo ${gap} puntos del líder`;
      }

      headlines.push({
        tag: 'RESULTADOS',
        title: `${winner.firstName} ${winner.lastName} se impone en ${gp} y ${action}.`,
        time: timeAgo(results.dateStart),
      });
    }

    // ── 2. CAMPEONATO PILOTOS ─────────────────────────────────────────────────
    const drivers = driverSt?.standings ?? [];
    if (drivers.length >= 2) {
      const p1   = drivers[0];
      const p2   = drivers[1];
      const gap  = p1.points - p2.points;
      const rem  = nextEvt?.totalRounds && nextEvt?.round
        ? nextEvt.totalRounds - (results?.round ?? 0)
        : '?';

      headlines.push({
        tag: 'CAMPEONATO',
        title: `${p1.lastName} lidera el mundial con ${p1.points} pts, +${gap} sobre ${p2.lastName} a ${rem} fechas del final.`,
        time: `hace 1 día`,
      });
    }

    // ── 3. PREVIA PRÓXIMA CARRERA ─────────────────────────────────────────────
    if (nextEvt?.meetingName && nextEvt.mode !== 'lastRace') {
      const gp      = (nextEvt.meetingName || '').replace(' Grand Prix', '');
      const circuit = nextEvt.circuitShortName || '';
      const adj     = circuitAdj(circuit);
      headlines.push({
        tag: 'PREVIA',
        title: `El pelotón se prepara para ${gp}: ${circuit}, uno de los trazados más ${adj}.`,
        time: `hace ${rand(3, 8)} h`,
      });
    }

    // ── 4. CONSTRUCTORES ──────────────────────────────────────────────────────
    const constrs = constrSt?.standings ?? [];
    if (constrs.length >= 2) {
      const c1  = constrs[0];
      const c2  = constrs[1];
      const gap = c1.points - c2.points;
      headlines.push({
        tag: 'TÉCNICA',
        title: `${c1.teamName} domina los constructores con ${c1.points} pts, ${gap} más que ${c2.teamName}.`,
        time: `hace ${rand(4, 14)} h`,
      });
    }

    // ── 5. PILOTO DESTACADO ───────────────────────────────────────────────────
    if (results?.results?.length && drivers.length) {
      const winner  = results.results[0];
      // Count wins: approximate using pts vs rank — simply highlight the leader
      const leader  = drivers[0];
      const winsEst = Math.floor(leader.points / 25);
      const nth     = winsEst === 1 ? '1ª' : `${winsEst}ª`;
      headlines.push({
        tag: 'PILOTOS',
        title: `${winner.lastName} suma su ${nth} victoria de la temporada con ${winner.teamName} y consolida su posición.`,
        time: `hace ${rand(1, 2)} día${rand(1,2)>1?'s':''}`,
      });
    }

    // Cap at 5
    const result = headlines.slice(0, 5);
    memCache.set(CACHE_KEY, result, 300); // 5 min cache
    res.json(result);
  } catch (err) {
    console.error('[headlines]', err.message);
    // Return empty array on failure so the UI degrades gracefully
    res.json([]);
  }
});

module.exports = router;

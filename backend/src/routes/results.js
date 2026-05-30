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
async function buildResultsForSession(sessionKey, round, meeting, raceWeekends) {
  const [positions, drivers, laps, intervals] = await Promise.all([
    get('/position', { session_key: sessionKey }),
    get('/drivers',  { session_key: sessionKey }),
    get('/laps',     { session_key: sessionKey }).catch(() => []),
    get('/intervals',{ session_key: sessionKey }).catch(() => []),
  ]);

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

  let fastestLapDriver = null, fastestLapDuration = Infinity;
  for (const lap of laps) {
    if (lap.lap_duration && lap.lap_duration < fastestLapDuration) {
      fastestLapDuration = lap.lap_duration;
      fastestLapDriver   = lap.driver_number;
    }
  }

  const totalLaps = laps.length > 0 ? Math.max(...laps.map(l => l.lap_number || 0)) : null;

  const finalGap = new Map();
  for (const iv of intervals) {
    if (iv.gap_to_leader !== null && iv.gap_to_leader !== undefined) {
      finalGap.set(iv.driver_number, iv.gap_to_leader);
    }
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

  return {
    round,
    totalRounds:      raceWeekends.length,
    meetingName:      meeting.meeting_name || '',
    circuitShortName: meeting.circuit_short_name || '',
    countryName:      meeting.country_name || '',
    countryCode:      meeting.country_code || '',
    dateStart:        meeting.date_start || '',
    totalLaps,
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
    const [meetings, sessions] = await Promise.all([getMeetings(year), getSessions(year)]);
    const now = new Date();

    const completedRaces = sessions
      .filter(s => s.session_type === 'Race' && s.session_name === 'Race' && new Date(s.date_end) < now)
      .sort((a, b) => b.date_start.localeCompare(a.date_start));

    if (completedRaces.length === 0)
      return res.json({ message: 'No completed races yet', results: null });

    const lastRace    = completedRaces[0];
    const raceWeekends = meetings
      .filter(m => !m.meeting_name.toLowerCase().includes('testing'))
      .sort((a, b) => a.date_start.localeCompare(b.date_start));
    const round   = raceWeekends.findIndex(m => m.meeting_key === lastRace.meeting_key) + 1;
    const meeting = raceWeekends[round - 1] || {};

    const result = await buildResultsForSession(lastRace.session_key, round, meeting, raceWeekends);
    cache.set(cacheKey, result, 3600);
    res.json(result);
  } catch (err) {
    console.error('[results/latest]', err.message);
    res.status(502).json({ error: 'Failed to fetch results', detail: err.message });
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
    const [meetings, sessions] = await Promise.all([getMeetings(year), getSessions(year)]);
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

    const result = await buildResultsForSession(
      raceSession.session_key, roundNum, meeting, raceWeekends
    );
    cache.set(cacheKey, result, 86400); // 24h — past race data never changes
    res.json(result);
  } catch (err) {
    console.error(`[results/${roundNum}]`, err.message);
    res.status(502).json({ error: 'Failed to fetch round results', detail: err.message });
  }
});

module.exports = router;

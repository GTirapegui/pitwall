const express = require('express');
const router  = express.Router();
const cache     = require('../cache/memoryCache');
const fileCache = require('../cache/fileCache');
const { getMeetings, getSessions } = require('../services/openf1');
const axios = require('axios');

// Convert F1 Index.json (local times + GmtOffset) → UTC ISO string
function gmtOffsetToMs(offset) {
  const sign = offset.startsWith('-') ? -1 : 1;
  const [h, m] = offset.replace(/^-/, '').split(':');
  return sign * (parseInt(h, 10) * 60 + parseInt(m, 10)) * 60 * 1000;
}
function localToUtc(localStr, gmtOffset) {
  return new Date(new Date(localStr + 'Z').getTime() - gmtOffsetToMs(gmtOffset || '00:00:00')).toISOString();
}

async function buildFromF1Index(year) {
  const { data } = await axios.get(
    `https://livetiming.formula1.com/static/${year}/Index.json`,
    { timeout: 8000 }
  );
  const raceWeekends = (data.Meetings || [])
    .filter(m => !m.Name.toLowerCase().includes('test'))
    .sort((a, b) => a.Sessions[0]?.StartDate.localeCompare(b.Sessions[0]?.StartDate))
    .map((m, i) => ({
      round:            m.Number ?? i + 1,
      meetingKey:       m.Key,
      meetingName:      m.Name,
      circuitShortName: m.Circuit?.ShortName ?? '',
      countryName:      m.Country?.Name ?? '',
      countryCode:      m.Country?.Code ?? '',
      location:         m.Location ?? '',
      dateStart:        localToUtc(m.Sessions[0]?.StartDate, m.Sessions[0]?.GmtOffset),
      dateEnd:          localToUtc(m.Sessions[m.Sessions.length - 1]?.EndDate, m.Sessions[m.Sessions.length - 1]?.GmtOffset),
      isCancelled:      false,
      sessions:         (m.Sessions || []).map(s => ({
        sessionKey:  s.Key,
        sessionName: s.Name,
        sessionType: s.Type,
        dateStart:   localToUtc(s.StartDate, s.GmtOffset),
        dateEnd:     localToUtc(s.EndDate,   s.GmtOffset),
      })),
    }));
  return { season: year, totalRounds: raceWeekends.length, meetings: raceWeekends };
}

async function buildFromOpenF1(year) {
  const [meetings, sessions] = await Promise.all([
    getMeetings(year),
    getSessions(year),
  ]);

  const sessionsByMeeting = new Map();
  for (const s of sessions) {
    const key = s.meeting_key;
    if (!sessionsByMeeting.has(key)) sessionsByMeeting.set(key, []);
    sessionsByMeeting.get(key).push({
      sessionKey:  s.session_key,
      sessionName: s.session_name,
      sessionType: s.session_type,
      dateStart:   s.date_start,
      dateEnd:     s.date_end,
    });
  }

  const raceWeekends = meetings
    .filter(m => !m.meeting_name.toLowerCase().includes('test'))
    .sort((a, b) => a.date_start.localeCompare(b.date_start))
    .map((m, i) => ({
      round:            i + 1,
      meetingKey:       m.meeting_key,
      meetingName:      m.meeting_name,
      circuitShortName: m.circuit_short_name,
      countryName:      m.country_name,
      countryCode:      m.country_code,
      location:         m.location,
      dateStart:        m.date_start,
      dateEnd:          m.date_end,
      isCancelled:      m.is_cancelled,
      sessions:         (sessionsByMeeting.get(m.meeting_key) || [])
        .sort((a, b) => a.dateStart.localeCompare(b.dateStart)),
    }));

  return { season: year, totalRounds: raceWeekends.length, meetings: raceWeekends };
}

async function buildAndCacheSchedule(year) {
  const memKey  = `schedule_${year}`;
  const fileKey = `schedule_v2_${year}`; // v2 busts any stale pre-refactor cache

  // 1. Memory cache
  const inMem = cache.get(memKey);
  if (inMem) return inMem;

  // 2. File cache (survives restarts)
  const onDisk = fileCache.get(fileKey);
  if (onDisk) {
    cache.set(memKey, onDisk, 3600);
    return onDisk;
  }

  // 3. Primary: F1 Index.json — always accessible, has the full season calendar
  let result;
  try {
    result = await buildFromF1Index(year);
    console.log(`[schedule] loaded ${result.meetings.length} races from F1 Index.json`);
  } catch (f1Err) {
    // 4. Fallback: OpenF1 (may be blocked during live sessions)
    console.warn('[schedule] F1 Index.json failed, trying OpenF1:', f1Err.message);
    result = await buildFromOpenF1(year);
  }

  cache.set(memKey, result, 3600);
  fileCache.set(fileKey, result, 6 * 3600); // 6 h on disk — refreshes daily
  return result;
}

// GET /api/schedule — all race weekends for the current season
router.get('/', async (req, res) => {
  const year = new Date().getFullYear();
  try {
    res.json(await buildAndCacheSchedule(year));
  } catch (err) {
    console.error('[schedule]', err.message);
    res.status(502).json({ error: 'Failed to fetch schedule', detail: err.message });
  }
});

async function warmUpSchedule() {
  const year = new Date().getFullYear();
  try {
    await buildAndCacheSchedule(year);
    console.log('[warmup] schedule ready');
  } catch (err) {
    console.warn('[warmup] schedule failed:', err.message);
  }
}

module.exports = router;
module.exports.warmUpSchedule = warmUpSchedule;
module.exports.buildAndCacheSchedule = buildAndCacheSchedule;

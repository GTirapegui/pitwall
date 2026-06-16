const express   = require('express');
const router    = express.Router();
const cache     = require('../cache/memoryCache');
const fileCache = require('../cache/fileCache');
const { getMeetings, getSessions } = require('../services/openf1');
const axios     = require('axios');

// ── Country name → ISO 2-letter code (for flag CDN) ──────────────────────────
const COUNTRY_CODES = {
  'Australia':'au','China':'cn','Japan':'jp','USA':'us','United States':'us',
  'Canada':'ca','Monaco':'mc','Spain':'es','Austria':'at','UK':'gb',
  'United Kingdom':'gb','Belgium':'be','Hungary':'hu','Netherlands':'nl',
  'Italy':'it','Azerbaijan':'az','Singapore':'sg','Mexico':'mx','Brazil':'br',
  'Qatar':'qa','UAE':'ae','United Arab Emirates':'ae','Bahrain':'bh',
  'Saudi Arabia':'sa','France':'fr','Germany':'de','Portugal':'pt',
};

// ── Jolpica (Ergast replacement) — full season calendar ────────────────────────
async function buildFromJolpica(year) {
  const { data } = await axios.get(
    `https://api.jolpi.ca/ergast/f1/${year}/races/`,
    { timeout: 8000 }
  );
  const races = data?.MRData?.RaceTable?.Races ?? [];
  if (!races.length) throw new Error('jolpica returned empty races');

  const SESSION_DUR = { practice: 60, qualifying: 60, sprintQualifying: 45, sprint: 60, race: 120 };

  function addMin(isoDate, isoTime, minutes) {
    const dt = new Date(`${isoDate}T${isoTime}`);
    return new Date(dt.getTime() + minutes * 60_000).toISOString();
  }

  const meetings = races.map(r => {
    const sessions = [];

    if (r.FirstPractice?.date)
      sessions.push({ sessionKey: null, sessionName: 'Practice 1', sessionType: 'Practice',
        dateStart: `${r.FirstPractice.date}T${r.FirstPractice.time}`,
        dateEnd:   addMin(r.FirstPractice.date, r.FirstPractice.time, SESSION_DUR.practice) });

    if (r.SprintQualifying?.date)
      sessions.push({ sessionKey: null, sessionName: 'Sprint Qualifying', sessionType: 'Qualifying',
        dateStart: `${r.SprintQualifying.date}T${r.SprintQualifying.time}`,
        dateEnd:   addMin(r.SprintQualifying.date, r.SprintQualifying.time, SESSION_DUR.sprintQualifying) });

    if (r.SecondPractice?.date)
      sessions.push({ sessionKey: null, sessionName: 'Practice 2', sessionType: 'Practice',
        dateStart: `${r.SecondPractice.date}T${r.SecondPractice.time}`,
        dateEnd:   addMin(r.SecondPractice.date, r.SecondPractice.time, SESSION_DUR.practice) });

    if (r.Sprint?.date)
      sessions.push({ sessionKey: null, sessionName: 'Sprint', sessionType: 'Race',
        dateStart: `${r.Sprint.date}T${r.Sprint.time}`,
        dateEnd:   addMin(r.Sprint.date, r.Sprint.time, SESSION_DUR.sprint) });

    if (r.ThirdPractice?.date)
      sessions.push({ sessionKey: null, sessionName: 'Practice 3', sessionType: 'Practice',
        dateStart: `${r.ThirdPractice.date}T${r.ThirdPractice.time}`,
        dateEnd:   addMin(r.ThirdPractice.date, r.ThirdPractice.time, SESSION_DUR.practice) });

    if (r.Qualifying?.date)
      sessions.push({ sessionKey: null, sessionName: 'Qualifying', sessionType: 'Qualifying',
        dateStart: `${r.Qualifying.date}T${r.Qualifying.time}`,
        dateEnd:   addMin(r.Qualifying.date, r.Qualifying.time, SESSION_DUR.qualifying) });

    sessions.push({ sessionKey: null, sessionName: 'Race', sessionType: 'Race',
      dateStart: `${r.date}T${r.time}`,
      dateEnd:   addMin(r.date, r.time, SESSION_DUR.race) });

    sessions.sort((a, b) => a.dateStart.localeCompare(b.dateStart));

    return {
      round:            parseInt(r.round, 10),
      meetingKey:       parseInt(r.round, 10) * 1000,
      meetingName:      r.raceName,
      circuitShortName: r.Circuit?.Location?.locality ?? r.Circuit?.circuitName ?? '',
      countryName:      r.Circuit?.Location?.country ?? '',
      countryCode:      COUNTRY_CODES[r.Circuit?.Location?.country ?? ''] ?? '',
      location:         r.Circuit?.Location?.locality ?? '',
      dateStart:        sessions[0]?.dateStart ?? `${r.date}T${r.time}`,
      dateEnd:          sessions[sessions.length - 1]?.dateEnd ?? `${r.date}T00:00:00Z`,
      isCancelled:      false,
      sessions,
    };
  });

  return { season: year, totalRounds: meetings.length, meetings };
}

// ── F1 Index.json — only used as fallback (covers races set up so far) ─────────
function gmtOffsetToMs(offset) {
  const sign = offset.startsWith('-') ? -1 : 1;
  const [h, m] = offset.replace(/^-/, '').split(':');
  return sign * (parseInt(h, 10) * 60 + parseInt(m, 10)) * 60 * 1000;
}
function localToUtc(localStr, gmtOffset) {
  return new Date(new Date(localStr + 'Z').getTime() - gmtOffsetToMs(gmtOffset || '00:00:00')).toISOString();
}

async function buildFromF1Index(year) {
  const { data: raw } = await axios.get(
    `https://livetiming.formula1.com/static/${year}/Index.json`,
    { timeout: 8000, responseType: 'text' }
  );
  const data = JSON.parse(raw.replace(/^﻿/, '')); // strip BOM
  const raceWeekends = (data.Meetings || [])
    .filter(m => !m.Name.toLowerCase().includes('test'))
    .sort((a, b) => a.Sessions[0]?.StartDate.localeCompare(b.Sessions[0]?.StartDate))
    .map((m, i) => {
      const sessions = (m.Sessions || []).map(s => ({
        sessionKey:  s.Key,
        sessionName: s.Name,
        sessionType: s.Type,
        dateStart:   localToUtc(s.StartDate, s.GmtOffset),
        dateEnd:     localToUtc(s.EndDate,   s.GmtOffset),
      }));
      sessions.sort((a, b) => a.dateStart.localeCompare(b.dateStart));
      return {
        round:            m.Number ?? i + 1,
        meetingKey:       m.Key,
        meetingName:      m.Name,
        circuitShortName: m.Circuit?.ShortName ?? '',
        countryName:      m.Country?.Name ?? '',
        countryCode:      m.Country?.Code ?? '',
        location:         m.Location ?? '',
        dateStart:        sessions[0]?.dateStart ?? '',
        dateEnd:          sessions[sessions.length - 1]?.dateEnd ?? '',
        isCancelled:      false,
        sessions,
      };
    });
  return { season: year, totalRounds: raceWeekends.length, meetings: raceWeekends };
}

// ── OpenF1 — last resort ───────────────────────────────────────────────────────
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
      sessionKey: s.session_key, sessionName: s.session_name,
      sessionType: s.session_type, dateStart: s.date_start, dateEnd: s.date_end,
    });
  }
  const raceWeekends = meetings
    .filter(m => !m.meeting_name.toLowerCase().includes('test'))
    .sort((a, b) => a.date_start.localeCompare(b.date_start))
    .map((m, i) => ({
      round: i + 1, meetingKey: m.meeting_key, meetingName: m.meeting_name,
      circuitShortName: m.circuit_short_name, countryName: m.country_name,
      countryCode: m.country_code, location: m.location,
      dateStart: m.date_start, dateEnd: m.date_end, isCancelled: m.is_cancelled,
      sessions: (sessionsByMeeting.get(m.meeting_key) || [])
        .sort((a, b) => a.dateStart.localeCompare(b.dateStart)),
    }));
  return { season: year, totalRounds: raceWeekends.length, meetings: raceWeekends };
}

// ── Main builder ───────────────────────────────────────────────────────────────
async function buildAndCacheSchedule(year) {
  const memKey  = `schedule_${year}`;
  const fileKey = `schedule_v4_${year}`; // v4: adds countryCode from COUNTRY_CODES map

  const inMem = cache.get(memKey);
  if (inMem) return inMem;

  const onDisk = fileCache.get(fileKey);
  if (onDisk) {
    cache.set(memKey, onDisk, 3600);
    return onDisk;
  }

  let result;
  try {
    result = await buildFromJolpica(year);
    console.log(`[schedule] jolpica: ${result.meetings.length} races`);
  } catch (e1) {
    console.warn('[schedule] jolpica failed:', e1.message);
    try {
      result = await buildFromF1Index(year);
      console.log(`[schedule] F1 Index: ${result.meetings.length} races`);
    } catch (e2) {
      console.warn('[schedule] F1 Index failed:', e2.message);
      result = await buildFromOpenF1(year);
      console.log(`[schedule] OpenF1: ${result.meetings.length} races`);
    }
  }

  cache.set(memKey, result, 3600);
  fileCache.set(fileKey, result, 6 * 3600);
  return result;
}

// ── Routes ─────────────────────────────────────────────────────────────────────
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

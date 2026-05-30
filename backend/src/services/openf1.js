const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'https://api.openf1.org/v1';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Accept': 'application/json' },
});

async function get(path, params = {}) {
  try {
    const { data } = await client.get(path, { params });
    return data;
  } catch (err) {
    if (err.response?.status === 429) {
      // One retry after 2s on rate-limit
      await new Promise(r => setTimeout(r, 2000));
      const { data } = await client.get(path, { params });
      return data;
    }
    throw err;
  }
}

// Returns all sessions for a given year
async function getSessions(year = new Date().getFullYear()) {
  return get('/sessions', { year });
}

// Returns all meetings (race weekends) for a given year
async function getMeetings(year = new Date().getFullYear()) {
  return get('/meetings', { year });
}

// Returns drivers for a given session key
async function getDrivers(sessionKey) {
  return get('/drivers', { session_key: sessionKey });
}

// Returns the driver standings via position data
async function getDriverStandings(sessionKey) {
  return get('/position', { session_key: sessionKey });
}

// Returns all race results (finishing positions) for a session
async function getRaceResults(sessionKey) {
  return get('/position', { session_key: sessionKey });
}

// Returns lap data (for fastest lap detection)
async function getLaps(sessionKey) {
  return get('/laps', { session_key: sessionKey });
}

// Returns intervals (gaps) for a session
async function getIntervals(sessionKey) {
  return get('/intervals', { session_key: sessionKey });
}

// Returns team radio (not used but available)
async function getTeamRadio(sessionKey) {
  return get('/team_radio', { session_key: sessionKey });
}

module.exports = { getSessions, getMeetings, getDrivers, getDriverStandings, getRaceResults, getLaps, getIntervals, get };

const fs   = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '../../.cache');

function ensureDir() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
}

function filePath(key) {
  return path.join(DIR, `${key.replace(/[^a-z0-9_-]/gi, '_')}.json`);
}

function get(key) {
  try {
    const raw = fs.readFileSync(filePath(key), 'utf8');
    const { data, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) return null;
    return data;
  } catch {
    return null;
  }
}

function set(key, data, ttlSeconds = 86400) {
  try {
    ensureDir();
    const payload = JSON.stringify({ data, expiresAt: Date.now() + ttlSeconds * 1000 });
    fs.writeFileSync(filePath(key), payload, 'utf8');
  } catch (e) {
    console.warn('[fileCache] write failed:', e.message);
  }
}

module.exports = { get, set };

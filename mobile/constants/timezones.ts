export interface TzOption {
  label: string;   // city display name
  tz: string;      // IANA timezone
  code: string;    // ISO 3166-1 alpha-2 for flag
  region: 'Americas' | 'Europe' | 'Asia/Pacific';
}

export const TIMEZONES: TzOption[] = [
  // Americas
  { label: 'New York',      tz: 'America/New_York',              code: 'us', region: 'Americas' },
  { label: 'Los Angeles',   tz: 'America/Los_Angeles',           code: 'us', region: 'Americas' },
  { label: 'Mexico City',   tz: 'America/Mexico_City',           code: 'mx', region: 'Americas' },
  { label: 'Bogotá',        tz: 'America/Bogota',                code: 'co', region: 'Americas' },
  { label: 'Lima',          tz: 'America/Lima',                  code: 'pe', region: 'Americas' },
  { label: 'Santiago',      tz: 'America/Santiago',              code: 'cl', region: 'Americas' },
  { label: 'Buenos Aires',  tz: 'America/Argentina/Buenos_Aires',code: 'ar', region: 'Americas' },
  { label: 'São Paulo',     tz: 'America/Sao_Paulo',             code: 'br', region: 'Americas' },
  // Europe
  { label: 'London',        tz: 'Europe/London',                 code: 'gb', region: 'Europe' },
  { label: 'Madrid',        tz: 'Europe/Madrid',                 code: 'es', region: 'Europe' },
  { label: 'Paris',         tz: 'Europe/Paris',                  code: 'fr', region: 'Europe' },
  { label: 'Rome',          tz: 'Europe/Rome',                   code: 'it', region: 'Europe' },
  { label: 'Amsterdam',     tz: 'Europe/Amsterdam',              code: 'nl', region: 'Europe' },
  { label: 'Monaco',        tz: 'Europe/Monaco',                 code: 'mc', region: 'Europe' },
  // Asia / Pacific
  { label: 'Bahrain',       tz: 'Asia/Bahrain',                  code: 'bh', region: 'Asia/Pacific' },
  { label: 'Dubai',         tz: 'Asia/Dubai',                    code: 'ae', region: 'Asia/Pacific' },
  { label: 'Singapore',     tz: 'Asia/Singapore',                code: 'sg', region: 'Asia/Pacific' },
  { label: 'Shanghai',      tz: 'Asia/Shanghai',                 code: 'cn', region: 'Asia/Pacific' },
  { label: 'Tokyo',         tz: 'Asia/Tokyo',                    code: 'jp', region: 'Asia/Pacific' },
  { label: 'Melbourne',     tz: 'Australia/Melbourne',           code: 'au', region: 'Asia/Pacific' },
];

export const REGION_LABELS: Record<TzOption['region'], string> = {
  'Americas':    'AMÉRICAS',
  'Europe':      'EUROPA',
  'Asia/Pacific':'ASIA / PACÍFICO',
};

// ISO 3166-1 alpha-2 codes (lowercase) — used for flagcdn.com URLs on web

export const COUNTRY_CODES: Record<string, string> = {
  'Australia': 'au',
  'Bahrain': 'bh',
  'Saudi Arabia': 'sa',
  'Japan': 'jp',
  'China': 'cn',
  'United States': 'us',
  'Italy': 'it',
  'Monaco': 'mc',
  'Canada': 'ca',
  'Spain': 'es',
  'Austria': 'at',
  'United Kingdom': 'gb',
  'Hungary': 'hu',
  'Belgium': 'be',
  'Netherlands': 'nl',
  'Azerbaijan': 'az',
  'Singapore': 'sg',
  'Mexico': 'mx',
  'Brazil': 'br',
  'Qatar': 'qa',
  'United Arab Emirates': 'ae',
};

export const DRIVER_CODES: Record<string, string> = {
  'VER': 'nl', 'NOR': 'gb', 'PIA': 'au', 'LEC': 'mc',
  'RUS': 'gb', 'HAM': 'gb', 'ANT': 'it', 'SAI': 'es',
  'ALO': 'es', 'STR': 'ca', 'GAS': 'fr', 'OCO': 'fr',
  'ALB': 'th', 'TSU': 'jp', 'HAD': 'fr', 'LAW': 'nz',
  'BOT': 'fi', 'HUL': 'de', 'MAG': 'dk', 'BEA': 'gb',
  'DOO': 'au', 'COL': 'ar', 'PER': 'mx', 'ZHO': 'cn',
  'BOR': 'br', 'SAR': 'us',
};

// Emoji fallback for native platforms (emoji flags render fine on iOS/Android)
export const CODE_TO_EMOJI: Record<string, string> = {
  'nl': '🇳🇱', 'gb': '🇬🇧', 'au': '🇦🇺', 'mc': '🇲🇨',
  'it': '🇮🇹', 'es': '🇪🇸', 'ca': '🇨🇦', 'fr': '🇫🇷',
  'th': '🇹🇭', 'jp': '🇯🇵', 'nz': '🇳🇿', 'fi': '🇫🇮',
  'de': '🇩🇪', 'dk': '🇩🇰', 'ar': '🇦🇷', 'mx': '🇲🇽',
  'cn': '🇨🇳', 'br': '🇧🇷', 'us': '🇺🇸', 'bh': '🇧🇭',
  'sa': '🇸🇦', 'at': '🇦🇹', 'hu': '🇭🇺', 'be': '🇧🇪',
  'az': '🇦🇿', 'sg': '🇸🇬', 'qa': '🇶🇦', 'ae': '🇦🇪',
};

export function getCountryCode(country: string): string {
  return COUNTRY_CODES[country] ?? 'un';
}

export function getDriverCode(abbreviation: string): string {
  return DRIVER_CODES[abbreviation] ?? 'un';
}

import es from './es';
import en from './en';
import pt from './pt';
import fr from './fr';
import de from './de';
import it from './it';
import ja from './ja';
import nl from './nl';

export const LOCALES: Record<string, typeof en> = { es, en, pt, fr, de, it, ja, nl };

const TIMEZONE_LOCALE: Record<string, string> = {
  // Español
  'America/Santiago':                    'es',
  'America/Buenos_Aires':                'es',
  'America/Argentina/Buenos_Aires':      'es',
  'America/Bogota':                      'es',
  'America/Lima':                        'es',
  'America/Mexico_City':                 'es',
  'America/Caracas':                     'es',
  'America/Montevideo':                  'es',
  'Europe/Madrid':                       'es',
  // Portugués
  'America/Sao_Paulo':                   'pt',
  'America/Fortaleza':                   'pt',
  'Europe/Lisbon':                       'pt',
  // Inglés
  'America/New_York':                    'en',
  'America/Los_Angeles':                 'en',
  'America/Chicago':                     'en',
  'America/Toronto':                     'en',
  'America/Vancouver':                   'en',
  'Europe/London':                       'en',
  'Australia/Melbourne':                 'en',
  'Australia/Sydney':                    'en',
  'Asia/Singapore':                      'en',
  'Asia/Bahrain':                        'en',
  'Asia/Dubai':                          'en',
  // Francés
  'Europe/Paris':                        'fr',
  'Europe/Monaco':                       'fr',
  'America/Montreal':                    'fr',
  // Alemán
  'Europe/Berlin':                       'de',
  'Europe/Vienna':                       'de',
  // Italiano
  'Europe/Rome':                         'it',
  // Japonés
  'Asia/Tokyo':                          'ja',
  // Holandés
  'Europe/Amsterdam':                    'nl',
};

export function getLocaleFromTimezone(timezone: string): string {
  return TIMEZONE_LOCALE[timezone] ?? 'en';
}

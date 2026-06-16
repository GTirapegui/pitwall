export type CircuitData = {
  key:          string;
  name:         string;
  country:      string;
  nat:          string;
  km:           number;
  turns:        number;
  laps:         number;
  drs:          number;
  compounds:    string[];
  record:       string;
  recordDriver: string;
  recordYear:   string;
  clockwise:    boolean;
  lat:          number;
  lon:          number;
  mapUrl:       string;
};

// ── O(1) lookup: circuit_short_name / circuitShortName / country_name / countryName → circuit key ──
const CIRCUIT_LOOKUP: Record<string, string> = {
  // circuit_short_name exactos que devuelve OpenF1
  'Monte Carlo':           'monaco',
  'Monaco':                'monaco',
  'Barcelona':             'barcelona',
  'Catalunya':             'barcelona',
  'Silverstone':           'silverstone',
  'Monza':                 'monza',
  'Spa-Francorchamps':     'spa',
  'Zandvoort':             'zandvoort',
  'Hungaroring':           'hungaroring',
  'Albert Park':           'albert_park',
  'Melbourne':             'albert_park',
  'Shanghai':              'shanghai',
  'Suzuka':                'suzuka',
  'Sakhir':                'bahrain',
  'Bahrain':               'bahrain',
  'Jeddah':                'jeddah',
  'Miami':                 'miami',
  'Imola':                 'imola',
  'Red Bull Ring':         'red_bull_ring',
  'Spielberg':             'red_bull_ring',
  'Baku':                  'baku',
  'Marina Bay':            'marina_bay',
  'Singapore':             'marina_bay',
  'Austin':                'cota',
  'COTA':                  'cota',
  'Mexico City':           'rodriguez',
  'Hermanos Rodriguez':    'rodriguez',
  'Interlagos':            'interlagos',
  'São Paulo':             'interlagos',
  'Sao Paulo':             'interlagos',
  'Las Vegas':             'las_vegas',
  'Lusail':                'lusail',
  'Yas Marina':            'yas_marina',
  'Yas Marina Circuit':    'yas_marina',
  'Abu Dhabi':             'yas_marina',
  'Gilles Villeneuve':     'villeneuve',
  'Montreal':              'villeneuve',
  'Madring':               'madrid',
  // Jolpica locality names (may differ from OpenF1 circuit_short_name)
  'Spa':                   'spa',
  'Budapest':              'hungaroring',
  'Madrid':                'madrid',
  'Abu Dhabi':             'yas_marina',
  'Marina Bay':            'marina_bay',
  // country_name / countryName as fallback
  'Spain':                 'barcelona',
  'United Kingdom':        'silverstone',
  'Italy':                 'monza',
  'Belgium':               'spa',
  'Netherlands':           'zandvoort',
  'Hungary':               'hungaroring',
  'Australia':             'albert_park',
  'China':                 'shanghai',
  'Japan':                 'suzuka',
  'Saudi Arabia':          'jeddah',
  'United States':         'cota',
  'Mexico':                'rodriguez',
  'Brazil':                'interlagos',
  'Qatar':                 'lusail',
  'Azerbaijan':            'baku',
  'Austria':               'red_bull_ring',
  'Canada':                'villeneuve',
  'United Arab Emirates':  'yas_marina',
};

const F1LAPS = 'https://raw.githubusercontent.com/f1laps/f1-track-layouts/main/2023';

// ── Circuit data indexed by key ──────────────────────────────────────────────
const CIRCUITS_DATA: Record<string, CircuitData> = {
  monaco: {
    key: 'monaco', name: 'Circuit de Monaco', country: 'Mónaco', nat: 'mc',
    km: 3.337, turns: 19, laps: 78, drs: 1,
    compounds: ['C3', 'C4', 'C5'],
    record: '1:12.909', recordDriver: 'Leclerc', recordYear: '24',
    clockwise: true, lat: 43.7347, lon: 7.4206,
    mapUrl: `${F1LAPS}/monaco.svg`,
  },
  barcelona: {
    key: 'barcelona', name: 'Circuit de Barcelona-Catalunya', country: 'España', nat: 'es',
    km: 4.657, turns: 14, laps: 66, drs: 2,
    compounds: ['C1', 'C2', 'C3'],
    record: '1:12.882', recordDriver: 'Verstappen', recordYear: '23',
    clockwise: true, lat: 41.57, lon: 2.261,
    mapUrl: `${F1LAPS}/spain.svg`,
  },
  silverstone: {
    key: 'silverstone', name: 'Silverstone Circuit', country: 'Gran Bretaña', nat: 'gb',
    km: 5.891, turns: 18, laps: 52, drs: 2,
    compounds: ['C2', 'C3', 'C4'],
    record: '1:27.097', recordDriver: 'Sainz', recordYear: '20',
    clockwise: true, lat: 52.0786, lon: -1.0169,
    mapUrl: `${F1LAPS}/great_britain.svg`,
  },
  monza: {
    key: 'monza', name: 'Autodromo Nazionale Monza', country: 'Italia', nat: 'it',
    km: 5.793, turns: 11, laps: 53, drs: 3,
    compounds: ['C4', 'C5', 'C6'],
    record: '1:21.046', recordDriver: 'Barrichello', recordYear: '04',
    clockwise: true, lat: 45.6156, lon: 9.2811,
    mapUrl: `${F1LAPS}/italy.svg`,
  },
  spa: {
    key: 'spa', name: 'Circuit de Spa-Francorchamps', country: 'Bélgica', nat: 'be',
    km: 7.004, turns: 19, laps: 44, drs: 3,
    compounds: ['C1', 'C2', 'C3'],
    record: '1:41.252', recordDriver: 'Bottas', recordYear: '18',
    clockwise: true, lat: 50.4372, lon: 5.9714,
    mapUrl: `${F1LAPS}/belgium.svg`,
  },
  zandvoort: {
    key: 'zandvoort', name: 'Circuit Zandvoort', country: 'Países Bajos', nat: 'nl',
    km: 4.259, turns: 14, laps: 72, drs: 2,
    compounds: ['C1', 'C2', 'C3'],
    record: '1:11.097', recordDriver: 'Verstappen', recordYear: '21',
    clockwise: true, lat: 52.3888, lon: 4.5409,
    mapUrl: `${F1LAPS}/netherlands.svg`,
  },
  hungaroring: {
    key: 'hungaroring', name: 'Hungaroring', country: 'Hungría', nat: 'hu',
    km: 4.381, turns: 14, laps: 70, drs: 2,
    compounds: ['C2', 'C3', 'C4'],
    record: '1:16.627', recordDriver: 'Hamilton', recordYear: '20',
    clockwise: true, lat: 47.5789, lon: 19.2486,
    mapUrl: `${F1LAPS}/hungary.svg`,
  },
  albert_park: {
    key: 'albert_park', name: 'Albert Park Circuit', country: 'Australia', nat: 'au',
    km: 5.278, turns: 16, laps: 58, drs: 4,
    compounds: ['C2', 'C3', 'C4'],
    record: '1:20.235', recordDriver: 'Leclerc', recordYear: '24',
    clockwise: true, lat: -37.8497, lon: 144.968,
    mapUrl: `${F1LAPS}/australia.svg`,
  },
  shanghai: {
    key: 'shanghai', name: 'Shanghai International Circuit', country: 'China', nat: 'cn',
    km: 5.451, turns: 16, laps: 56, drs: 2,
    compounds: ['C1', 'C2', 'C3'],
    record: '1:32.238', recordDriver: 'Leclerc', recordYear: '24',
    clockwise: true, lat: 31.3389, lon: 121.2198,
    mapUrl: `${F1LAPS}/china.svg`,
  },
  suzuka: {
    key: 'suzuka', name: 'Suzuka International Racing Course', country: 'Japón', nat: 'jp',
    km: 5.807, turns: 18, laps: 53, drs: 2,
    compounds: ['C1', 'C2', 'C3'],
    record: '1:30.983', recordDriver: 'Leclerc', recordYear: '24',
    clockwise: false, lat: 34.8431, lon: 136.5414,
    mapUrl: `${F1LAPS}/japan.svg`,
  },
  bahrain: {
    key: 'bahrain', name: 'Bahrain International Circuit', country: 'Bahréin', nat: 'bh',
    km: 5.412, turns: 15, laps: 57, drs: 3,
    compounds: ['C1', 'C2', 'C3'],
    record: '1:31.447', recordDriver: 'De la Rosa', recordYear: '05',
    clockwise: true, lat: 26.0325, lon: 50.5106,
    mapUrl: `${F1LAPS}/bahrain.svg`,
  },
  jeddah: {
    key: 'jeddah', name: 'Jeddah Corniche Circuit', country: 'Arabia Saudita', nat: 'sa',
    km: 6.174, turns: 27, laps: 50, drs: 3,
    compounds: ['C2', 'C3', 'C4'],
    record: '1:27.653', recordDriver: 'Leclerc', recordYear: '24',
    clockwise: true, lat: 21.6319, lon: 39.1044,
    mapUrl: `${F1LAPS}/saudi_arabia.svg`,
  },
  miami: {
    key: 'miami', name: 'Miami International Autodrome', country: 'Estados Unidos', nat: 'us',
    km: 5.412, turns: 19, laps: 57, drs: 3,
    compounds: ['C3', 'C4', 'C5'],
    record: '1:29.708', recordDriver: 'Verstappen', recordYear: '23',
    clockwise: true, lat: 25.9581, lon: -80.2389,
    mapUrl: `${F1LAPS}/miami.svg`,
  },
  imola: {
    key: 'imola', name: 'Autodromo Enzo e Dino Ferrari', country: 'Italia', nat: 'it',
    km: 4.909, turns: 19, laps: 63, drs: 2,
    compounds: ['C2', 'C3', 'C4'],
    record: '1:15.484', recordDriver: 'Leclerc', recordYear: '24',
    clockwise: false, lat: 44.3439, lon: 11.7167,
    mapUrl: `${F1LAPS}/emilia_romagna.svg`,
  },
  red_bull_ring: {
    key: 'red_bull_ring', name: 'Red Bull Ring', country: 'Austria', nat: 'at',
    km: 4.318, turns: 10, laps: 71, drs: 3,
    compounds: ['C3', 'C4', 'C5'],
    record: '1:05.619', recordDriver: 'Sainz', recordYear: '20',
    clockwise: true, lat: 47.2197, lon: 14.7647,
    mapUrl: `${F1LAPS}/austria.svg`,
  },
  baku: {
    key: 'baku', name: 'Baku City Circuit', country: 'Azerbaiyán', nat: 'az',
    km: 6.003, turns: 20, laps: 51, drs: 2,
    compounds: ['C3', 'C4', 'C5'],
    record: '1:40.203', recordDriver: 'Leclerc', recordYear: '23',
    clockwise: true, lat: 40.3725, lon: 49.8533,
    mapUrl: `${F1LAPS}/azerbaijan.svg`,
  },
  marina_bay: {
    key: 'marina_bay', name: 'Marina Bay Street Circuit', country: 'Singapur', nat: 'sg',
    km: 4.940, turns: 19, laps: 62, drs: 3,
    compounds: ['C3', 'C4', 'C5'],
    record: '1:35.867', recordDriver: 'Sainz', recordYear: '23',
    clockwise: false, lat: 1.2914, lon: 103.8640,
    mapUrl: `${F1LAPS}/singapore.svg`,
  },
  cota: {
    key: 'cota', name: 'Circuit of The Americas', country: 'Estados Unidos', nat: 'us',
    km: 5.513, turns: 20, laps: 56, drs: 3,
    compounds: ['C2', 'C3', 'C4'],
    record: '1:36.169', recordDriver: 'Leclerc', recordYear: '22',
    clockwise: true, lat: 30.1328, lon: -97.6411,
    mapUrl: `${F1LAPS}/united_states.svg`,
  },
  rodriguez: {
    key: 'rodriguez', name: 'Autodromo Hermanos Rodríguez', country: 'México', nat: 'mx',
    km: 4.304, turns: 17, laps: 71, drs: 3,
    compounds: ['C4', 'C5', 'C6'],
    record: '1:17.774', recordDriver: 'Bottas', recordYear: '21',
    clockwise: true, lat: 19.4042, lon: -99.0907,
    mapUrl: `${F1LAPS}/mexico.svg`,
  },
  interlagos: {
    key: 'interlagos', name: 'Autodromo José Carlos Pace', country: 'Brasil', nat: 'br',
    km: 4.309, turns: 15, laps: 71, drs: 2,
    compounds: ['C2', 'C3', 'C4'],
    record: '1:10.540', recordDriver: 'Bottas', recordYear: '18',
    clockwise: false, lat: -23.7036, lon: -46.6997,
    mapUrl: `${F1LAPS}/brazil.svg`,
  },
  las_vegas: {
    key: 'las_vegas', name: 'Las Vegas Strip Circuit', country: 'Estados Unidos', nat: 'us',
    km: 6.201, turns: 17, laps: 50, drs: 3,
    compounds: ['C4', 'C5', 'C6'],
    record: '1:35.490', recordDriver: 'Leclerc', recordYear: '23',
    clockwise: true, lat: 36.1147, lon: -115.1728,
    mapUrl: `${F1LAPS}/las_vegas.svg`,
  },
  lusail: {
    key: 'lusail', name: 'Lusail International Circuit', country: 'Catar', nat: 'qa',
    km: 5.380, turns: 16, laps: 57, drs: 2,
    compounds: ['C1', 'C2', 'C3'],
    record: '1:24.319', recordDriver: 'Verstappen', recordYear: '23',
    clockwise: true, lat: 25.49, lon: 51.4542,
    mapUrl: `${F1LAPS}/qatar.svg`,
  },
  yas_marina: {
    key: 'yas_marina', name: 'Yas Marina Circuit', country: 'Abu Dabi', nat: 'ae',
    km: 5.281, turns: 16, laps: 58, drs: 3,
    compounds: ['C3', 'C4', 'C5'],
    record: '1:26.103', recordDriver: 'Leclerc', recordYear: '23',
    clockwise: true, lat: 24.4672, lon: 54.6031,
    mapUrl: `${F1LAPS}/abu_dhabi.svg`,
  },
  villeneuve: {
    key: 'villeneuve', name: 'Circuit Gilles Villeneuve', country: 'Canadá', nat: 'ca',
    km: 4.361, turns: 14, laps: 70, drs: 2,
    compounds: ['C3', 'C4', 'C5'],
    record: '1:13.078', recordDriver: 'Leclerc', recordYear: '19',
    clockwise: true, lat: 45.5, lon: -73.5228,
    mapUrl: `${F1LAPS}/canada.svg`,
  },
  madrid: {
    key: 'madrid', name: 'Madring', country: 'España', nat: 'es',
    km: 5.475, turns: 20, laps: 56, drs: 3,
    compounds: ['C3', 'C4', 'C5'],
    record: '—', recordDriver: '—', recordYear: '26',
    clockwise: true, lat: 40.4168, lon: -3.7038,
    mapUrl: '',
  },
};

// ── Public lookup function ───────────────────────────────────────────────────
export function getCircuitByEvent(event: any): CircuitData | null {
  if (!event) return null;

  // Attempt 1: circuit_short_name (OpenF1 snake_case) or circuitShortName (camelCase)
  const shortName = event?.circuit_short_name ?? event?.circuitShortName;
  if (shortName) {
    const found = CIRCUITS_DATA[CIRCUIT_LOOKUP[shortName]];
    if (found) return found;
  }

  // Attempt 2: country_name / countryName
  const country = event?.country_name ?? event?.countryName;
  if (country) {
    const found = CIRCUITS_DATA[CIRCUIT_LOOKUP[country]];
    if (found) return found;
  }

  // Attempt 3: meeting_name / meetingName fuzzy match against lookup keys
  const meeting: string = event?.meeting_name ?? event?.meetingName ?? event?.gp ?? '';
  if (meeting) {
    const meetingLower = meeting.toLowerCase();
    for (const [key, circuitKey] of Object.entries(CIRCUIT_LOOKUP)) {
      if (meetingLower.includes(key.toLowerCase())) {
        const found = CIRCUITS_DATA[circuitKey];
        if (found) return found;
      }
    }
  }

  console.warn('[circuits] no match for event:', {
    circuit_short_name: shortName,
    country_name: country,
    meeting_name: meeting,
  });
  return null;
}

export function getCircuit(shortName: string): CircuitData | undefined {
  return getCircuitByEvent({ circuit_short_name: shortName }) ?? undefined;
}

export const COMPOUND_COLORS: Record<string, string> = {
  C1: '#ffffff', C2: '#F2C94C', C3: '#FF8C00',
  C4: '#E8002D', C5: '#B00500', C6: '#8B0000',
};

export { CIRCUITS_DATA as CIRCUITS };

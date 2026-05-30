const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  schedule: () => apiFetch<ScheduleResponse>('/api/schedule'),
  nextEvent: () => apiFetch<NextEventResponse>('/api/next-event'),
  driverStandings: () => apiFetch<StandingsResponse<DriverStanding>>('/api/standings/drivers'),
  constructorStandings: () => apiFetch<StandingsResponse<ConstructorStanding>>('/api/standings/constructors'),
  latestResults: () => apiFetch<ResultsResponse>('/api/results/latest'),
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface SessionEntry {
  sessionKey: number;
  sessionName: string;
  sessionType: string;
  dateStart: string;
  dateEnd: string;
}

export interface MeetingEntry {
  round: number;
  meetingKey: number;
  meetingName: string;
  circuitShortName: string;
  countryName: string;
  countryCode: string;
  location: string;
  dateStart: string;
  dateEnd: string;
  isCancelled: boolean;
  sessions: SessionEntry[];
}

export interface ScheduleResponse {
  season: number;
  totalRounds: number;
  meetings: MeetingEntry[];
}

export interface NextEventResponse extends MeetingEntry {
  totalRounds: number;
  mode?: 'lastRace';
  message?: string;
  nextMeeting?: null;
}

export interface DriverStanding {
  position: number;
  driverNumber: number;
  abbreviation: string;
  firstName: string;
  lastName: string;
  teamName: string;
  teamColor: string;
  flag: string;
  points: number;
}

export interface ConstructorStanding {
  position: number;
  teamName: string;
  teamColor: string;
  points: number;
  drivers: string[];
}

export interface StandingsResponse<T> {
  season: number;
  standings: T[];
}

export interface RaceResult {
  position: number;
  driverNumber: number;
  abbreviation: string;
  firstName: string;
  lastName: string;
  teamName: string;
  teamColor: string;
  flag: string;
  points: number;
  gap: string | null;
  fastestLap: boolean;
}

export interface ResultsResponse {
  round: number;
  totalRounds: number;
  meetingName: string;
  circuitShortName: string;
  countryName: string;
  countryCode: string;
  dateStart: string;
  totalLaps: number | null;
  results: RaceResult[];
  message?: string;
}

import useSWR from 'swr';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface LiveDriver {
  driverNumber: number;
  position:     number;
  abbreviation: string;
  firstName:    string;
  lastName:     string;
  teamName:     string;
  teamColour:   string;
  gap:          string;
  lastLap?:     string;
  interval?:    string;
}

interface LivePositions { sessionKey: string | number; standings: LiveDriver[] }

const fetchPositions = (key: number): Promise<LivePositions> =>
  fetch(`${BASE}/api/live/positions?session_key=${key}`).then(r => r.json());

/**
 * High-frequency poll (4 s) for live timing data.
 * Only active when sessionKey is non-null (i.e., a session is live).
 * Deactivates automatically on unmount.
 */
export function useLiveData(sessionKey: number | null) {
  const { data, error, isValidating } = useSWR<LivePositions>(
    sessionKey !== null ? `live/positions/${sessionKey}` : null,
    () => fetchPositions(sessionKey!),
    {
      refreshInterval:     4_000,
      revalidateOnFocus:   true,
      revalidateOnReconnect: true,
      keepPreviousData:    true,
      dedupingInterval:    2_000,
    }
  );

  return {
    standings:   data?.standings ?? [],
    error,
    isValidating,
    updatedAt:   data ? Date.now() : null,
  };
}

import useSWR from 'swr';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface LiveSession {
  sessionKey: number;
  name: string;
  type: string;
  gp: string;
  country: string;
  location: string;
  circuitShort: string;
  dateStart: string;
  dateEnd: string;
}

export interface LiveStatus {
  isLive: boolean;
  session: LiveSession | null;
}

const fetcher = (): Promise<LiveStatus> =>
  fetch(`${BASE}/api/live/status`).then(r => r.json());

/**
 * Global live-status hook — polled every 60 s across the whole app.
 * SWR deduplicates: multiple components calling this share one network request.
 */
export function useLiveStatus() {
  const { data, error, isValidating } = useSWR<LiveStatus>(
    'live/status',
    fetcher,
    { refreshInterval: 60_000, revalidateOnFocus: true, keepPreviousData: true }
  );
  return {
    isLive:      data?.isLive    ?? false,
    session:     data?.session   ?? null,
    error,
    isValidating,
  };
}

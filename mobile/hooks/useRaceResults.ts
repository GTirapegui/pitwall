import useSWR from 'swr';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

interface PodiumEntry {
  position: number;
  abbreviation: string;
  firstName: string;
  lastName: string;
  teamName: string;
  teamColor: string;
}

interface RoundResult {
  round: number;
  podium: PodiumEntry[] | null;
}

async function fetchRound(round: number): Promise<RoundResult> {
  const res = await fetch(`${BASE_URL}/api/results/${round}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export function useRaceResults(round: number | null) {
  const { data, error } = useSWR<RoundResult>(
    round !== null ? `results-round-${round}` : null,
    () => fetchRound(round!),
    { revalidateOnFocus: false, dedupingInterval: 3_600_000 }
  );
  return { podium: data?.podium ?? null, error };
}

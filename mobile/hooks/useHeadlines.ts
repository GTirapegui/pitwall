import useSWR from 'swr';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export interface Headline {
  tag:   'RESULTADOS' | 'CAMPEONATO' | 'PREVIA' | 'TÉCNICA' | 'PILOTOS';
  title: string;
  time:  string;
}

const fetcher = () =>
  fetch(`${BASE}/api/headlines`).then(r => r.json()) as Promise<Headline[]>;

export function useHeadlines() {
  return useSWR<Headline[]>('headlines', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000, // 5 min
  });
}

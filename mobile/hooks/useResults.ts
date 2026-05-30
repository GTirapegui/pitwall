import useSWR from 'swr';
import { api, ResultsResponse } from '@/services/api';

export function useResults() {
  const { data, error, isLoading, mutate } = useSWR<ResultsResponse>(
    'results/latest',
    api.latestResults,
    // 30s polling — latest result can be updated just after a race ends
    { refreshInterval: 30_000, revalidateOnFocus: true, keepPreviousData: true }
  );
  return { data, error, isLoading, refresh: mutate };
}

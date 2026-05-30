import useSWR from 'swr';
import { api, NextEventResponse } from '@/services/api';

export function useNextEvent() {
  const { data, error, isLoading, mutate } = useSWR<NextEventResponse>(
    'next-event',
    api.nextEvent,
    { refreshInterval: 60_000, revalidateOnFocus: true, keepPreviousData: true }
  );
  return { data, error, isLoading, refresh: mutate };
}

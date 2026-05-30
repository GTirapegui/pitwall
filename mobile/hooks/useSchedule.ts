import useSWR from 'swr';
import { api, ScheduleResponse } from '@/services/api';

export function useSchedule() {
  const { data, error, isLoading, mutate } = useSWR<ScheduleResponse>(
    'schedule',
    api.schedule,
    { refreshInterval: 0, revalidateOnFocus: false, dedupingInterval: 3_600_000 }
  );
  return { data, error, isLoading, refresh: mutate };
}

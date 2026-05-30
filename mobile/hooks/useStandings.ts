import useSWR from 'swr';
import { api, DriverStanding, ConstructorStanding, StandingsResponse } from '@/services/api';

export function useDriverStandings() {
  const { data, error, isLoading, mutate } = useSWR<StandingsResponse<DriverStanding>>(
    'standings/drivers',
    api.driverStandings,
    { refreshInterval: 300_000, revalidateOnFocus: true, keepPreviousData: true }
  );
  return { data, error, isLoading, refresh: mutate };
}

export function useConstructorStandings() {
  const { data, error, isLoading, mutate } = useSWR<StandingsResponse<ConstructorStanding>>(
    'standings/constructors',
    api.constructorStandings,
    { refreshInterval: 300_000, revalidateOnFocus: true, keepPreviousData: true }
  );
  return { data, error, isLoading, refresh: mutate };
}

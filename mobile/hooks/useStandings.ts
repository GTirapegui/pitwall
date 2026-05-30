import { useEffect } from 'react';
import { AppState } from 'react-native';
import useSWR, { mutate as globalMutate } from 'swr';
import { api, DriverStanding, ConstructorStanding, StandingsResponse } from '@/services/api';

const STANDINGS_KEYS = ['standings/drivers', 'standings/constructors'] as const;

// SWR's revalidateOnFocus relies on browser visibility events which don't fire in React
// Native. We wire AppState manually so the standings refresh when the app comes to foreground.
// Called once from useDriverStandings (always mounted with useConstructorStandings).
function useAppStateRevalidate() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') STANDINGS_KEYS.forEach(k => globalMutate(k));
    });
    return () => sub.remove();
  }, []);
}

export function useDriverStandings() {
  useAppStateRevalidate();
  const { data, error, isLoading, mutate } = useSWR<StandingsResponse<DriverStanding>>(
    'standings/drivers',
    api.driverStandings,
    {
      refreshInterval: 300_000,
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: false,
      dedupingInterval: 0,
      fallbackData: { season: 0, standings: [] },
    }
  );
  return { data, error, isLoading, refresh: mutate };
}

export function useConstructorStandings() {
  const { data, error, isLoading, mutate } = useSWR<StandingsResponse<ConstructorStanding>>(
    'standings/constructors',
    api.constructorStandings,
    {
      refreshInterval: 300_000,
      revalidateOnFocus: false,
      revalidateOnMount: true,
      keepPreviousData: false,
      dedupingInterval: 0,
      fallbackData: { season: 0, standings: [] },
    }
  );
  return { data, error, isLoading, refresh: mutate };
}

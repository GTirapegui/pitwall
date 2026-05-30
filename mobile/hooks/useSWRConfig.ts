import { SWRConfiguration } from 'swr';

/**
 * Global SWR defaults — stale-while-revalidate strategy.
 * Screens receive cached data immediately and refresh in background.
 */
export const SWR_GLOBAL: SWRConfiguration = {
  revalidateOnFocus:     true,
  revalidateOnReconnect: true,
  shouldRetryOnError:    true,
  errorRetryCount:       3,
  errorRetryInterval:    5000,
  // Never show a blank screen — keep stale data while revalidating
  keepPreviousData:      true,
};

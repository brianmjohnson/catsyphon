/**
 * TanStack Query client configuration.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes - show cached data for better UX
      // No global refetchInterval - add per-query for live data needs (e.g., Dashboard)
      refetchIntervalInBackground: false, // Pause when tab inactive
    },
  },
});

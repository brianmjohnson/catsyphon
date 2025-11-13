/**
 * TanStack Query client configuration.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 10, // 10 seconds (short for live data)
      refetchInterval: 15000, // Auto-refresh every 15 seconds
      refetchIntervalInBackground: false, // Pause when tab inactive
    },
  },
});

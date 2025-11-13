/**
 * Tests for TanStack Query client configuration.
 */

import { describe, it, expect } from 'vitest';
import { queryClient } from './queryClient';

describe('queryClient', () => {
  it('should be configured with correct default options', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    expect(defaultOptions.queries).toBeDefined();
    expect(defaultOptions.queries?.retry).toBe(1);
    expect(defaultOptions.queries?.refetchOnWindowFocus).toBe(false);
  });

  it('should have correct staleTime for caching', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    // Should be 5 minutes for better UX with cached data
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 60 * 5);
  });

  it('should not have global refetch interval', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    // No global auto-refresh - added per-query (e.g., Dashboard)
    expect(defaultOptions.queries?.refetchInterval).toBeUndefined();
  });

  it('should pause polling when tab is inactive', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    // Should not refetch in background
    expect(defaultOptions.queries?.refetchIntervalInBackground).toBe(false);
  });

  it('should have a valid query cache', () => {
    const queryCache = queryClient.getQueryCache();
    expect(queryCache).toBeDefined();
    expect(queryCache.getAll()).toEqual([]);
  });

  it('should have a valid mutation cache', () => {
    const mutationCache = queryClient.getMutationCache();
    expect(mutationCache).toBeDefined();
    expect(mutationCache.getAll()).toEqual([]);
  });
});

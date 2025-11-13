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

  it('should have correct staleTime for live data', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    // Should be 10 seconds for live polling
    expect(defaultOptions.queries?.staleTime).toBe(1000 * 10);
  });

  it('should have 15 second refetch interval configured', () => {
    const defaultOptions = queryClient.getDefaultOptions();

    // 15 seconds auto-refresh
    expect(defaultOptions.queries?.refetchInterval).toBe(15000);
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

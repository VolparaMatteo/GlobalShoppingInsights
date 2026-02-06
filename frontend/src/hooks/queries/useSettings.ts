import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import {
  getWPConfig,
  updateWPConfig,
  getBlacklist,
  addBlacklist,
  removeBlacklist,
  getScrapingSettings,
  updateScrapingSettings,
  getDedupSettings,
  updateDedupSettings,
} from '@/services/api/settings.api';
import type { WPConfigUpdate, BlacklistCreate, ScrapingSettings, DedupSettings } from '@/types';

// ---------------------------------------------------------------------------
// WordPress Configuration
// ---------------------------------------------------------------------------

/** Fetches the current WordPress integration configuration. */
export function useWPConfig() {
  return useQuery({
    queryKey: queryKeys.settings.wordpress(),
    queryFn: getWPConfig,
  });
}

/** Updates WordPress configuration. Invalidates WP config cache on success. */
export function useUpdateWPConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WPConfigUpdate) => updateWPConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.wordpress() });
    },
  });
}

// ---------------------------------------------------------------------------
// Domain Blacklist
// ---------------------------------------------------------------------------

/** Fetches the domain blacklist. */
export function useBlacklist() {
  return useQuery({
    queryKey: [...queryKeys.settings.all, 'blacklist'] as const,
    queryFn: getBlacklist,
  });
}

/** Adds a domain to the blacklist. Invalidates blacklist cache on success. */
export function useAddBlacklistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BlacklistCreate) => addBlacklist(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.settings.all, 'blacklist'],
      });
    },
  });
}

/** Removes a domain from the blacklist. Invalidates blacklist cache on success. */
export function useDeleteBlacklistEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => removeBlacklist(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.settings.all, 'blacklist'],
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Scraping Settings
// ---------------------------------------------------------------------------

/** Fetches scraping engine configuration. */
export function useScrapingSettings() {
  return useQuery({
    queryKey: [...queryKeys.settings.all, 'scraping'] as const,
    queryFn: getScrapingSettings,
  });
}

/** Updates scraping engine configuration. */
export function useUpdateScrapingSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<ScrapingSettings>) => updateScrapingSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.settings.all, 'scraping'],
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Deduplication Settings
// ---------------------------------------------------------------------------

/** Fetches deduplication configuration. */
export function useDedupSettings() {
  return useQuery({
    queryKey: [...queryKeys.settings.all, 'dedup'] as const,
    queryFn: getDedupSettings,
  });
}

/** Updates deduplication configuration. */
export function useUpdateDedupSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<DedupSettings>) => updateDedupSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...queryKeys.settings.all, 'dedup'],
      });
    },
  });
}

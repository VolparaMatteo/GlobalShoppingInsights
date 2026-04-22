// ---------------------------------------------------------------------------
// hooks/queries/useHealth.ts  --  polling /health per banner status + debug
// ---------------------------------------------------------------------------
import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/config/queryKeys';
import { getHealth } from '@/services/api/health.api';

/**
 * Polla /health ogni 60 secondi. Usato da LLMStatusBanner (mostra banner
 * se ollama_circuit e' OPEN) e dal dashboard admin (debug stato deep).
 *
 * Non fa `retry`: se /health risponde 503 vogliamo saperlo, non riprovare
 * all'infinito.
 */
export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health.status(),
    queryFn: getHealth,
    refetchInterval: 60_000, // 60s
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 30_000,
  });
}

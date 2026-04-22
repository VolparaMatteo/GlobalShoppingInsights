// ---------------------------------------------------------------------------
// services/api/health.api.ts  --  GET /health
// ---------------------------------------------------------------------------
import client from './client';

export interface CircuitSnapshot {
  name: string;
  state: 'closed' | 'open' | 'half_open';
  failures: number;
  opened_at: number | null;
  reset_timeout: number;
  failure_threshold: number;
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  env: string;
  checks: {
    database: { status: string; latency_ms?: number };
    disk: { status: string; free_gb?: number; used_pct?: number };
    uploads: { status: string };
    ollama: { status: string; models?: string[] };
    ollama_circuit: CircuitSnapshot;
  };
}

export async function getHealth(): Promise<HealthStatus> {
  const { data } = await client.get<HealthStatus>('/health');
  return data;
}

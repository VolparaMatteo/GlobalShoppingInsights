// ---------------------------------------------------------------------------
// services/api/settings.api.ts  --  Application settings endpoints
// ---------------------------------------------------------------------------
import client from './client';
import type {
  WPConfig,
  WPConfigUpdate,
  BlacklistEntry,
  BlacklistCreate,
  ScrapingSettings,
  DedupSettings,
  MessageResponse,
} from '@/types';

// ---- WordPress config ----------------------------------------------------

/** GET /settings/wordpress */
export async function getWPConfig(): Promise<WPConfig> {
  const { data } = await client.get<WPConfig>('/settings/wordpress');
  return data;
}

/** PATCH /settings/wordpress */
export async function updateWPConfig(payload: WPConfigUpdate): Promise<WPConfig> {
  const { data } = await client.patch<WPConfig>('/settings/wordpress', payload);
  return data;
}

/** POST /settings/wordpress/test */
export async function testWPConnection(): Promise<MessageResponse> {
  const { data } = await client.post<MessageResponse>('/settings/wordpress/test');
  return data;
}

// ---- Domain blacklist ----------------------------------------------------

/** GET /settings/blacklist */
export async function getBlacklist(): Promise<BlacklistEntry[]> {
  const { data } = await client.get<BlacklistEntry[]>('/settings/blacklist');
  return data;
}

/** POST /settings/blacklist */
export async function addBlacklist(payload: BlacklistCreate): Promise<BlacklistEntry> {
  const { data } = await client.post<BlacklistEntry>('/settings/blacklist', payload);
  return data;
}

/** DELETE /settings/blacklist/:id */
export async function removeBlacklist(id: number): Promise<void> {
  await client.delete(`/settings/blacklist/${id}`);
}

// ---- Scraping settings ---------------------------------------------------

/** GET /settings/scraping */
export async function getScrapingSettings(): Promise<ScrapingSettings> {
  const { data } = await client.get<ScrapingSettings>('/settings/scraping');
  return data;
}

/** PATCH /settings/scraping */
export async function updateScrapingSettings(
  payload: Partial<ScrapingSettings>,
): Promise<ScrapingSettings> {
  const { data } = await client.patch<ScrapingSettings>('/settings/scraping', payload);
  return data;
}

// ---- Deduplication settings ----------------------------------------------

/** GET /settings/dedup */
export async function getDedupSettings(): Promise<DedupSettings> {
  const { data } = await client.get<DedupSettings>('/settings/dedup');
  return data;
}

/** PATCH /settings/dedup */
export async function updateDedupSettings(payload: Partial<DedupSettings>): Promise<DedupSettings> {
  const { data } = await client.patch<DedupSettings>('/settings/dedup', payload);
  return data;
}

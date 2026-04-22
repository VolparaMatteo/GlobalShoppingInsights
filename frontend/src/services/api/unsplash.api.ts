// ---------------------------------------------------------------------------
// services/api/unsplash.api.ts  --  Unsplash image search proxy
// ---------------------------------------------------------------------------
import client from './client';

export interface UnsplashPhoto {
  id: string;
  thumb: string;
  small: string;
  regular: string;
  photographer: string;
  photographer_url: string;
  download_location: string;
}

export interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export async function searchUnsplash(
  query: string,
  page = 1,
  per_page = 12,
): Promise<UnsplashSearchResponse> {
  const { data } = await client.get<UnsplashSearchResponse>('/unsplash/search', {
    params: { query, page, per_page },
  });
  return data;
}

export async function trackDownload(download_location: string): Promise<void> {
  await client.post('/unsplash/download', null, {
    params: { download_location },
  });
}

// ---------------------------------------------------------------------------
// services/api/search.api.ts  --  Search run endpoints
// ---------------------------------------------------------------------------
import client from "./client";
import type { PaginatedResponse, SearchRun } from "@/types";

export interface GetSearchRunsParams {
  page?: number;
  page_size?: number;
  prompt_id?: number;
  status?: string;
}

/** GET /search-runs */
export async function getSearchRuns(
  params?: GetSearchRunsParams,
): Promise<PaginatedResponse<SearchRun>> {
  const { data } = await client.get<PaginatedResponse<SearchRun>>(
    "/search-runs",
    { params },
  );
  return data;
}

/** GET /search-runs/:id */
export async function getSearchRun(id: number): Promise<SearchRun> {
  const { data } = await client.get<SearchRun>(`/search-runs/${id}`);
  return data;
}

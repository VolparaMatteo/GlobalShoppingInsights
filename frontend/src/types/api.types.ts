// ---------------------------------------------------------------------------
// api.types.ts  --  Generic API envelope types
// Mirrors: backend/app/schemas/common.py
// ---------------------------------------------------------------------------

/** Wraps any paginated list endpoint. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Standard error payload returned by the API on 4xx / 5xx responses. */
export interface ApiError {
  detail: string;
  status_code?: number;
}

/** Simple acknowledgement response. */
export interface MessageResponse {
  message: string;
}

// ---------------------------------------------------------------------------
// services/api/publish.api.ts  --  WordPress publishing endpoints
// ---------------------------------------------------------------------------
import client from "./client";
import type { PaginatedResponse, JobLog, MessageResponse } from "@/types";

export interface PublishResponse {
  message: string;
  job_id?: number;
}

/** POST /publish/:articleId */
export async function publishArticle(
  articleId: number,
): Promise<PublishResponse> {
  const { data } = await client.post<PublishResponse>(
    `/publish/${articleId}`,
  );
  return data;
}

/** POST /publish/:articleId/retry */
export async function retryPublish(
  articleId: number,
): Promise<PublishResponse> {
  const { data } = await client.post<PublishResponse>(
    `/publish/${articleId}/retry`,
  );
  return data;
}

export interface GetPublishJobsParams {
  page?: number;
  page_size?: number;
  status?: string;
  job_type?: string;
}

/** GET /publish/jobs */
export async function getPublishJobs(
  params?: GetPublishJobsParams,
): Promise<PaginatedResponse<JobLog>> {
  const { data } = await client.get<PaginatedResponse<JobLog>>(
    "/publish/jobs",
    { params },
  );
  return data;
}

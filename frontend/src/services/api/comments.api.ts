// ---------------------------------------------------------------------------
// services/api/comments.api.ts  --  Article comment endpoints
// ---------------------------------------------------------------------------
import client from "./client";
import type { Comment, CommentCreate } from "@/types";

/** GET /articles/:articleId/comments */
export async function getComments(articleId: number): Promise<Comment[]> {
  const { data } = await client.get<Comment[]>(
    `/articles/${articleId}/comments`,
  );
  return data;
}

/** POST /articles/:articleId/comments */
export async function addComment(
  articleId: number,
  payload: CommentCreate,
): Promise<Comment> {
  const { data } = await client.post<Comment>(
    `/articles/${articleId}/comments`,
    payload,
  );
  return data;
}

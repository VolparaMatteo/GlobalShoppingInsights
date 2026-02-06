import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { getComments, addComment } from '@/services/api/comments.api';
import type { CommentCreate } from '@/types';

/**
 * Fetches all comments for a given article.
 */
export function useComments(articleId: string | number) {
  return useQuery({
    queryKey: queryKeys.articles.comments(articleId),
    queryFn: () => getComments(articleId),
    enabled: !!articleId,
  });
}

/**
 * Adds a new comment to an article.
 * Invalidates the article's comment list on success.
 */
export function useAddComment(articleId: string | number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CommentCreate) => addComment(articleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.articles.comments(articleId),
      });
    },
  });
}

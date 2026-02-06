// ---------------------------------------------------------------------------
// ArticleDetailPage.tsx  --  Full article detail view with two-column layout
// ---------------------------------------------------------------------------
import React, { useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Row, Col, Result, Tag } from 'antd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getArticle } from '@/services/api/articles.api';
import { queryKeys } from '@/config/queryKeys';
import { STATUS_MAP, type ArticleStatus } from '@/config/constants';
import type { Article } from '@/types';

import PageHeader from '@/components/common/PageHeader';
import LoadingSpinner from '@/components/common/LoadingSpinner';

import ArticleHeader from '@/pages/article/components/ArticleHeader';
import ArticleContent from '@/pages/article/components/ArticleContent';
import ArticleEditor from '@/pages/article/components/ArticleEditor';
import ArticleMetadata from '@/pages/article/components/ArticleMetadata';
import AIScorePanel from '@/pages/article/components/AIScorePanel';
import DuplicatePanel from '@/pages/article/components/DuplicatePanel';
import CommentsThread from '@/pages/article/components/CommentsThread';
import RevisionHistory from '@/pages/article/components/RevisionHistory';
import WorkflowActions from '@/pages/article/components/WorkflowActions';
import TagCategoryAssign from '@/pages/article/components/TagCategoryAssign';

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const articleId = Number(id);

  const {
    data: article,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: queryKeys.articles.detail(articleId),
    queryFn: () => getArticle(articleId),
    enabled: !isNaN(articleId),
  });

  const handleStatusChange = useCallback(
    (_updated: Article) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(articleId) });
    },
    [articleId, queryClient],
  );

  const handleEditorSave = useCallback(
    (_updated: Article) => {
      setIsEditing(false);
    },
    [],
  );

  // ---- Loading state --------------------------------------------------------
  if (isLoading) {
    return <LoadingSpinner tip="Loading article..." />;
  }

  // ---- Error state ----------------------------------------------------------
  if (isError || !article) {
    return (
      <Result
        status="error"
        title="Failed to load article"
        subTitle={
          (error as Error)?.message ?? 'The article could not be found or an error occurred.'
        }
      />
    );
  }

  // ---- Status badge for header ----------------------------------------------
  const statusMeta = STATUS_MAP[article.status as ArticleStatus];
  const statusBadge = statusMeta ? (
    <Tag color={statusMeta.color} style={{ backgroundColor: statusMeta.bgColor }}>
      {statusMeta.label}
    </Tag>
  ) : (
    <Tag>{article.status}</Tag>
  );

  // ---- Render ---------------------------------------------------------------
  return (
    <div>
      <PageHeader
        title={article.title}
        extra={
          <>
            {statusBadge}
            <WorkflowActions article={article} onStatusChange={handleStatusChange} />
          </>
        }
      />

      <ArticleHeader article={article} />

      <Row gutter={24}>
        {/* Left column -- main content */}
        <Col xs={24} lg={16}>
          {isEditing ? (
            <ArticleEditor
              article={article}
              onSave={handleEditorSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <ArticleContent
              article={article}
              onEditClick={() => setIsEditing(true)}
            />
          )}

          <CommentsThread articleId={article.id} />
        </Col>

        {/* Right column -- sidebar */}
        <Col xs={24} lg={8}>
          <ArticleMetadata article={article} />
          <AIScorePanel article={article} />
          <DuplicatePanel articleId={article.id} />
          <RevisionHistory articleId={article.id} />
          <TagCategoryAssign article={article} />
        </Col>
      </Row>
    </div>
  );
}

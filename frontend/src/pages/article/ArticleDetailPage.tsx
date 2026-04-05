// ---------------------------------------------------------------------------
// ArticleDetailPage.tsx  --  Full article detail view
// ---------------------------------------------------------------------------
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  Dropdown,
  Flex,
  message,
  Result,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  EditOutlined,
  GlobalOutlined,
  LinkOutlined,
  SearchOutlined,
  SwapOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import type { Article } from '@/types';
import { getArticle, changeStatus } from '@/services/api/articles.api';
import { queryKeys } from '@/config/queryKeys';
import {
  ARTICLE_STATUSES,
  STATUS_MAP,
  type ArticleStatus,
} from '@/config/constants';
import { buildPromptDetailPath } from '@/config/routes';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatusBadge from '@/pages/inbox/components/StatusBadge';
import ScoreBadge from '@/pages/inbox/components/ScoreBadge';

import ArticleContent from '@/pages/article/components/ArticleContent';
import ArticleEditor from '@/pages/article/components/ArticleEditor';
import ArticleMetadata from '@/pages/article/components/ArticleMetadata';
import AIScorePanel from '@/pages/article/components/AIScorePanel';
import CommentsThread from '@/pages/article/components/CommentsThread';
import TagCategoryAssign from '@/pages/article/components/TagCategoryAssign';

// ---------------------------------------------------------------------------

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

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

  // ---- Status mutation (force: any status) --------------------------------
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) =>
      changeStatus(articleId, { new_status: newStatus }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      message.success('Stato aggiornato');
    },
    onError: () => message.error('Impossibile aggiornare lo stato'),
  });

  const handleEditorSave = useCallback(() => setIsEditing(false), []);

  // ---- Loading / Error ----------------------------------------------------
  if (isLoading) return <LoadingSpinner tip="Caricamento articolo..." />;

  if (isError || !article) {
    return (
      <Result
        status="error"
        title="Errore nel caricamento"
        subTitle={(error as Error)?.message ?? "L'articolo non è stato trovato."}
      />
    );
  }

  // ---- Status dropdown (all statuses except current) ----------------------
  const statusMenuItems: MenuProps['items'] = ARTICLE_STATUSES
    .filter((s) => s !== article.status)
    .map((s) => {
      const meta = STATUS_MAP[s];
      return {
        key: s,
        label: (
          <Flex align="center" gap={8}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: meta?.color ?? '#8c8c8c',
                flexShrink: 0,
              }}
            />
            {meta?.label ?? s}
          </Flex>
        ),
        onClick: () => statusMutation.mutate(s),
      };
    });

  // ---- Render -------------------------------------------------------------
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* ---- Top bar ---- */}
      <Flex
        align="center"
        justify="space-between"
        style={{ marginBottom: 16 }}
      >
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate(-1)}
        >
          Torna indietro
        </Button>

        <Space>
          <Dropdown menu={{ items: statusMenuItems }} trigger={['click']}>
            <Button icon={<SwapOutlined />}>Cambia Stato</Button>
          </Dropdown>
          {!isEditing && (
            <Button
              icon={<EditOutlined />}
              onClick={() => setIsEditing(true)}
            >
              Modifica
            </Button>
          )}
        </Space>
      </Flex>

      {/* ---- Header ---- */}
      <div
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: '20px 24px',
          marginBottom: 24,
          border: '1px solid #f0f0f0',
        }}
      >
        <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
          <Dropdown menu={{ items: statusMenuItems }} trigger={['click']}>
            <Button size="small" type="text" style={{ padding: '0 4px', height: 'auto' }}>
              <Flex align="center" gap={4}>
                <StatusBadge status={article.status} />
                <SwapOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
              </Flex>
            </Button>
          </Dropdown>
          <ScoreBadge score={article.ai_score} />
        </Flex>

        <Typography.Title level={3} style={{ margin: '0 0 16px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
          {article.title}
        </Typography.Title>

        <Flex wrap="wrap" gap={16}>
          <Flex align="center" gap={6} style={{ fontSize: 13, color: '#595959' }}>
            <GlobalOutlined style={{ color: '#8c8c8c' }} />
            <a
              href={article.canonical_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {article.source_domain}
            </a>
            <Tag style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>
              {article.language.toUpperCase()}
            </Tag>
            {article.country && (
              <Tag style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>
                {article.country}
              </Tag>
            )}
          </Flex>

          {article.author && (
            <Flex align="center" gap={6} style={{ fontSize: 13, color: '#595959' }}>
              <UserOutlined style={{ color: '#8c8c8c' }} />
              {article.author}
            </Flex>
          )}

          <Flex align="center" gap={6} style={{ fontSize: 13, color: '#595959' }}>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            Pubblicato il{' '}
            {article.published_at
              ? dayjs(article.published_at).format('DD/MM/YY')
              : '—'}
          </Flex>

          <Flex align="center" gap={6} style={{ fontSize: 13, color: '#595959' }}>
            <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
            Importato il {dayjs(article.created_at).format('DD/MM/YY')}
          </Flex>
        </Flex>

        {/* ---- Prompt source ---- */}
        {article.prompts && article.prompts.length > 0 && (
          <Flex wrap="wrap" gap={8} style={{ marginTop: 12 }}>
            {article.prompts.map((p) => (
              <Tag
                key={p.id}
                icon={<SearchOutlined />}
                color="blue"
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(buildPromptDetailPath(p.id))}
              >
                {p.title}
              </Tag>
            ))}
          </Flex>
        )}
      </div>

      {/* ---- Two-column layout ---- */}
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
            <ArticleContent article={article} />
          )}

          <CommentsThread articleId={article.id} />
        </Col>

        {/* Right column -- sidebar */}
        <Col xs={24} lg={8}>
          <ArticleMetadata article={article} />
          <AIScorePanel article={article} />
          <TagCategoryAssign article={article} />
        </Col>
      </Row>
    </div>
  );
}

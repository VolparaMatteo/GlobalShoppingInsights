// ---------------------------------------------------------------------------
// ArticleDetailPage — Sprint 7 polish b11 (premium, Lucide, dark-mode aware)
// ---------------------------------------------------------------------------
import { useCallback, useState } from 'react';

import { Button, Col, Dropdown, Result, Row, Space, Typography, theme as antdTheme } from 'antd';
import type { MenuProps } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Clock,
  Globe2,
  Pencil,
  Search,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';

import LoadingSpinner from '@/components/common/LoadingSpinner';
import ScoreBadge from '@/components/common/ScoreBadge';
import StatusBadge from '@/components/common/StatusBadge';
import { ARTICLE_STATUSES, STATUS_MAP } from '@/config/constants';
import { buildPromptDetailPath } from '@/config/routes';
import { queryKeys } from '@/config/queryKeys';
import { useToast } from '@/hooks/useToast';
import AIScorePanel from '@/pages/article/components/AIScorePanel';
import ArticleContent from '@/pages/article/components/ArticleContent';
import ArticleEditor from '@/pages/article/components/ArticleEditor';
import ArticleMetadata from '@/pages/article/components/ArticleMetadata';
import CommentsThread from '@/pages/article/components/CommentsThread';
import TagCategoryAssign from '@/pages/article/components/TagCategoryAssign';
import { changeStatus, getArticle } from '@/services/api/articles.api';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------

export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = antdTheme.useToken();
  const toast = useToast();
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

  // Status mutation (force: any status)
  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => changeStatus(articleId, { new_status: newStatus }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(articleId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      toast.success('Stato aggiornato');
    },
    onError: (err) => toast.error(err),
  });

  const handleEditorSave = useCallback(() => setIsEditing(false), []);

  // ---- Loading / Error ----------------------------------------------------
  if (isLoading) return <LoadingSpinner tip="Caricamento articolo..." />;

  if (isError || !article) {
    return (
      <div style={{ maxWidth: 720, margin: '40px auto' }}>
        <Result
          status="error"
          title="Errore nel caricamento"
          subTitle={(error as Error)?.message ?? "L'articolo non è stato trovato."}
          extra={
            <Button
              icon={<ArrowLeft size={14} />}
              onClick={() => navigate(-1)}
              style={{ borderRadius: 8 }}
            >
              Torna indietro
            </Button>
          }
        />
      </div>
    );
  }

  const statusMenuItems: MenuProps['items'] = ARTICLE_STATUSES.filter(
    (s) => s !== article.status,
  ).map((s) => {
    const meta = STATUS_MAP[s];
    return {
      key: s,
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: meta?.color ?? token.colorTextTertiary,
              flexShrink: 0,
            }}
            aria-hidden="true"
          />
          {meta?.label ?? s}
        </span>
      ),
      onClick: () => statusMutation.mutate(s),
    };
  });

  // ---- Render -------------------------------------------------------------
  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Back link */}
      <Button
        type="text"
        size="small"
        icon={<ArrowLeft size={14} />}
        onClick={() => navigate(-1)}
        style={{
          marginBottom: 12,
          paddingLeft: 6,
          paddingRight: 10,
          height: 28,
          color: token.colorTextSecondary,
          fontWeight: 500,
        }}
      >
        Indietro
      </Button>

      {/* Hero card */}
      <div
        style={{
          background: token.colorBgContainer,
          borderRadius: 12,
          border: `1px solid ${token.colorBorderSecondary}`,
          boxShadow: 'var(--shadow-sm)',
          padding: '22px 24px',
          marginBottom: 20,
        }}
      >
        {/* Row top: status pill (dropdown) + score */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <Dropdown menu={{ items: statusMenuItems }} trigger={['click']}>
            <button
              type="button"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '2px 6px',
                background: 'transparent',
                border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'background 150ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = token.colorFillQuaternary)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              aria-label="Cambia stato"
            >
              <StatusBadge status={article.status} />
              <ChevronDown
                size={13}
                color={token.colorTextTertiary}
                style={{ marginLeft: 2, marginRight: 2 }}
              />
            </button>
          </Dropdown>

          <ScoreBadge score={article.ai_score} variant="pill" size="md" />
        </div>

        {/* Title */}
        <Title
          level={3}
          style={{
            margin: '0 0 14px',
            fontWeight: 700,
            letterSpacing: -0.3,
            lineHeight: 1.3,
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            color: token.colorText,
          }}
        >
          {article.title}
        </Title>

        {/* Meta pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
          <MetaPill icon={<Globe2 size={12} />} tone="link">
            <a
              href={article.canonical_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'inherit', textDecoration: 'none' }}
            >
              {article.source_domain}
            </a>
          </MetaPill>

          <MetaPill>{article.language.toUpperCase()}</MetaPill>

          {article.country && <MetaPill>{article.country}</MetaPill>}

          {article.author && <MetaPill icon={<UserIcon size={12} />}>{article.author}</MetaPill>}

          {article.published_at && (
            <MetaPill icon={<CalendarDays size={12} />}>
              Pubblicato {dayjs(article.published_at).format('DD/MM/YY')}
            </MetaPill>
          )}

          <MetaPill icon={<Clock size={12} />}>
            Importato {dayjs(article.created_at).format('DD/MM/YY')}
          </MetaPill>
        </div>

        {/* Prompt sources */}
        {article.prompts && article.prompts.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            <Text
              type="secondary"
              style={{
                fontSize: 11,
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginRight: 2,
                alignSelf: 'center',
              }}
            >
              Prompt sorgente
            </Text>
            {article.prompts.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(buildPromptDetailPath(p.id))}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 10px',
                  fontSize: 12,
                  fontWeight: 500,
                  borderRadius: 6,
                  cursor: 'pointer',
                  color: token.colorPrimary,
                  background:
                    'linear-gradient(135deg, rgba(22,119,255,0.1) 0%, rgba(114,46,209,0.1) 100%)',
                  border: `1px solid ${token.colorPrimary}33`,
                  transition: 'all 150ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(22,119,255,0.18) 0%, rgba(114,46,209,0.18) 100%)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(22,119,255,0.1) 0%, rgba(114,46,209,0.1) 100%)';
                }}
              >
                <Search size={11} strokeWidth={2.4} aria-hidden="true" />
                {p.title}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 18,
            paddingTop: 16,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Space size={8}>
            {!isEditing ? (
              <Button
                icon={<Pencil size={14} />}
                onClick={() => setIsEditing(true)}
                style={{ borderRadius: 8, height: 36, fontWeight: 500 }}
              >
                Modifica
              </Button>
            ) : (
              <Button
                icon={<X size={14} />}
                onClick={() => setIsEditing(false)}
                style={{ borderRadius: 8, height: 36, fontWeight: 500 }}
              >
                Annulla modifiche
              </Button>
            )}
          </Space>
        </div>
      </div>

      {/* Two-column layout */}
      <Row gutter={24}>
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

        <Col xs={24} lg={8}>
          <ArticleMetadata article={article} />
          <AIScorePanel article={article} />
          <TagCategoryAssign article={article} />
        </Col>
      </Row>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MetaPill — neutral rounded pill per le meta info nell'hero
// ---------------------------------------------------------------------------

interface MetaPillProps {
  icon?: React.ReactNode;
  children: React.ReactNode;
  tone?: 'neutral' | 'link';
}

function MetaPill({ icon, children, tone = 'neutral' }: MetaPillProps) {
  const { token } = antdTheme.useToken();
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '3px 10px',
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 6,
        color: tone === 'link' ? token.colorPrimary : token.colorTextSecondary,
        background: token.colorFillQuaternary,
        border: `1px solid ${token.colorBorderSecondary}`,
        lineHeight: 1.6,
        maxWidth: 280,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>}
      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{children}</span>
    </span>
  );
}

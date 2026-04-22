// ---------------------------------------------------------------------------
// ArticlePreviewDrawer  --  Side-panel preview for a single article
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react';
import {
  Button,
  Drawer,
  Dropdown,
  Flex,
  message,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from 'antd';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  FolderOutlined,
  GlobalOutlined,
  LinkOutlined,
  PictureOutlined,
  PlusOutlined,
  RobotOutlined,
  SearchOutlined,
  SwapOutlined,
  TagsOutlined,
  TranslationOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';

import type { Article } from '@/types';
import { buildArticleDetailPath, buildPromptDetailPath } from '@/config/routes';
import { queryKeys } from '@/config/queryKeys';
import { ARTICLE_STATUSES, STATUS_MAP, type ArticleStatus } from '@/config/constants';
import { changeStatus, translateArticle } from '@/services/api/articles.api';
import { batchAction } from '@/services/api/articles.api';
import { useTags, useCategories } from '@/hooks/queries/useTaxonomy';
import { useUpdateArticle, useUploadArticleImage } from '@/hooks/queries/useArticle';
import StatusBadge from '@/pages/inbox/components/StatusBadge';
import ScoreBadge from '@/pages/inbox/components/ScoreBadge';
import ImagePickerModal from '@/components/common/ImagePickerModal';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArticlePreviewDrawerProps {
  article: Article | null;
  open: boolean;
  onClose: () => void;
  onQuickAction?: (articleId: number, action: 'screened' | 'rejected') => void;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncate(text: string | null | undefined, maxLen = 800): string {
  if (!text) return 'Nessun contenuto disponibile.';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <Typography.Text
        type="secondary"
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          display: 'block',
          marginBottom: 8,
        }}
      >
        {label}
      </Typography.Text>
      {children}
    </div>
  );
}

function MetaItem({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Flex align="center" gap={6} style={{ fontSize: 13, color: '#595959' }}>
      <span style={{ color: '#8c8c8c', fontSize: 14, display: 'flex' }}>{icon}</span>
      {children}
    </Flex>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ArticlePreviewDrawer({
  article,
  open,
  onClose,
  onQuickAction,
  readOnly = false,
}: ArticlePreviewDrawerProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ---- Tag selector state -------------------------------------------------
  const [tagSelectOpen, setTagSelectOpen] = useState(false);

  // ---- Category selector state -------------------------------------------
  const [catSelectOpen, setCatSelectOpen] = useState(false);

  // ---- Unsplash picker state ---------------------------------------------
  const [unsplashOpen, setUnsplashOpen] = useState(false);

  // ---- Translation state --------------------------------------------------
  const [translation, setTranslation] = useState<{
    title: string | null;
    text: string | null;
  } | null>(null);
  const [translating, setTranslating] = useState(false);

  // Reset translation when article changes
  useEffect(() => {
    setTranslation(null);
  }, [article?.id]);

  // ---- Fetch all available tags & categories ------------------------------
  const { data: tagsData } = useTags();
  const allTags = tagsData?.items ?? [];

  const { data: categoriesData } = useCategories();
  const allCategories = categoriesData?.items ?? [];

  // ---- Update / upload article mutations ---------------------------------
  const updateArticleMutation = useUpdateArticle();
  const uploadImageMutation = useUploadArticleImage();

  // ---- Status mutation (force mode: any status) ---------------------------
  const statusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: number; newStatus: string }) =>
      changeStatus(id, { new_status: newStatus }, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      message.success('Stato aggiornato');
    },
    onError: () => {
      message.error('Impossibile aggiornare lo stato');
    },
  });

  // ---- Tag mutation (uses batch API for single article) -------------------
  const tagMutation = useMutation({
    mutationFn: (tagIds: number[]) =>
      batchAction({
        article_ids: [article!.id],
        action: 'tag',
        tag_ids: tagIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      message.success('Tag aggiornati');
      setTagSelectOpen(false);
    },
    onError: () => {
      message.error('Impossibile aggiornare i tag');
    },
  });

  // ---- Category mutation (uses batch API for single article) --------------
  const categoryMutation = useMutation({
    mutationFn: (categoryIds: number[]) =>
      batchAction({
        article_ids: [article!.id],
        action: 'category',
        category_ids: categoryIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      message.success('Categorie aggiornate');
      setCatSelectOpen(false);
    },
    onError: () => {
      message.error('Impossibile aggiornare le categorie');
    },
  });

  if (!article) return null;

  const needsTranslation = article.language != null && article.language !== 'it';

  const handleTranslate = async () => {
    setTranslating(true);
    try {
      const result = await translateArticle(article.id);
      setTranslation({
        title: result.translated_title,
        text: result.translated_text,
      });
    } catch {
      message.error('Errore durante la traduzione');
    } finally {
      setTranslating(false);
    }
  };

  const handleViewFull = () => {
    onClose();
    navigate(buildArticleDetailPath(article.id));
  };

  // ---- Status dropdown items (all statuses except current) ----------------
  const statusMenuItems: MenuProps['items'] = ARTICLE_STATUSES.filter(
    (s) => s !== article.status,
  ).map((s) => {
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
      onClick: () => statusMutation.mutate({ id: article.id, newStatus: s }),
    };
  });

  // ---- Tags already assigned to this article ------------------------------
  const assignedTagIds = new Set(article.tags?.map((t) => t.id) ?? []);
  const availableTagOptions = allTags
    .filter((t) => !assignedTagIds.has(t.id))
    .map((t) => ({ label: t.name, value: t.id }));

  const hasTags = article.tags && article.tags.length > 0;

  // ---- Categories already assigned to this article -----------------------
  const assignedCatIds = new Set(article.categories?.map((c) => c.id) ?? []);
  const availableCatOptions = allCategories
    .filter((c) => !assignedCatIds.has(c.id))
    .map((c) => ({ label: c.name, value: c.id }));

  return (
    <Drawer
      title={null}
      placement="right"
      width={540}
      open={open}
      onClose={onClose}
      styles={{
        header: { display: 'none' },
        body: { padding: 0 },
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* ---- Header ---- */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
            {readOnly ? (
              <StatusBadge status={article.status} />
            ) : (
              <Dropdown menu={{ items: statusMenuItems }} trigger={['click']}>
                <Button size="small" type="text" style={{ padding: '0 4px', height: 'auto' }}>
                  <Flex align="center" gap={4}>
                    <StatusBadge status={article.status} />
                    <SwapOutlined style={{ fontSize: 11, color: '#8c8c8c' }} />
                  </Flex>
                </Button>
              </Dropdown>
            )}
            <ScoreBadge score={article.ai_score} />
          </Flex>

          <Typography.Title level={4} style={{ margin: 0, lineHeight: 1.4 }}>
            {translation?.title || article.title}
          </Typography.Title>

          {needsTranslation && (
            <Flex align="center" gap={8} style={{ marginTop: 8 }}>
              <Button
                size="small"
                icon={<TranslationOutlined />}
                loading={translating}
                onClick={translation ? () => setTranslation(null) : handleTranslate}
              >
                {translation ? 'Mostra originale' : 'Traduci in italiano'}
              </Button>
              {translation && (
                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                  Tradotto
                </Tag>
              )}
            </Flex>
          )}
        </div>

        {/* ---- Scrollable body ---- */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* ---- Metadata ---- */}
          <Section label="Dettagli">
            <Flex vertical gap={8}>
              <MetaItem icon={<GlobalOutlined />}>
                {article.source_domain}
                {article.language && (
                  <Tag
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      lineHeight: '18px',
                      padding: '0 6px',
                    }}
                  >
                    {article.language.toUpperCase()}
                  </Tag>
                )}
                {article.country && (
                  <Tag
                    style={{
                      fontSize: 11,
                      lineHeight: '18px',
                      padding: '0 6px',
                    }}
                  >
                    {article.country}
                  </Tag>
                )}
              </MetaItem>

              {article.author && (
                <MetaItem icon={<span style={{ fontSize: 13 }}>&#9998;</span>}>
                  {article.author}
                </MetaItem>
              )}

              <MetaItem icon={<CalendarOutlined />}>
                Pubblicato il{' '}
                {article.published_at ? dayjs(article.published_at).format('DD/MM/YY') : '—'}
              </MetaItem>

              <MetaItem icon={<ClockCircleOutlined />}>
                Importato il {dayjs(article.created_at).format('DD/MM/YY')}
              </MetaItem>

              <MetaItem icon={<LinkOutlined />}>
                <a
                  href={article.canonical_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 13 }}
                >
                  Apri fonte originale
                </a>
              </MetaItem>
            </Flex>
          </Section>

          {/* ---- Prompt source ---- */}
          {article.prompts && article.prompts.length > 0 && (
            <Section label="Trovato da">
              <Flex vertical gap={8}>
                {article.prompts.map((p) => (
                  <div
                    key={p.id}
                    style={{
                      background: '#f6f8fa',
                      borderRadius: 6,
                      padding: '8px 12px',
                      border: '1px solid #f0f0f0',
                    }}
                  >
                    <Flex align="center" gap={6} style={{ marginBottom: 4 }}>
                      <SearchOutlined style={{ fontSize: 13, color: '#1890ff' }} />
                      <a
                        onClick={(e) => {
                          e.preventDefault();
                          onClose();
                          navigate(buildPromptDetailPath(p.id));
                        }}
                        style={{ fontSize: 13, fontWeight: 500 }}
                      >
                        {p.title}
                      </a>
                    </Flex>
                    {p.keywords.length > 0 && (
                      <Flex wrap="wrap" gap={4} style={{ marginTop: 4 }}>
                        {p.keywords.map((kw) => (
                          <Tag key={kw} color="geekblue" style={{ fontSize: 11, margin: 0 }}>
                            {kw}
                          </Tag>
                        ))}
                      </Flex>
                    )}
                  </div>
                ))}
              </Flex>
            </Section>
          )}

          {/* ---- AI Score Explanation ---- */}
          {(article.ai_score_explanation?.length || article.ai_relevance_comment) && (
            <Section label="Analisi AI">
              {article.ai_score_explanation && article.ai_score_explanation.length > 0 && (
                <Flex vertical gap={4}>
                  {article.ai_score_explanation.map((reason, idx) => (
                    <Typography.Text
                      key={idx}
                      type="secondary"
                      style={{ fontSize: 13, lineHeight: 1.5 }}
                    >
                      &bull; {reason}
                    </Typography.Text>
                  ))}
                </Flex>
              )}
              {article.ai_relevance_comment && (
                <div
                  style={{
                    marginTop: article.ai_score_explanation?.length ? 10 : 0,
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
                    borderRadius: 8,
                    border: '1px solid #d6e4ff',
                  }}
                >
                  <Flex align="center" gap={6} style={{ marginBottom: 6 }}>
                    <RobotOutlined style={{ fontSize: 13, color: '#1890ff' }} />
                    <Typography.Text strong style={{ fontSize: 12, color: '#1890ff' }}>
                      Analisi di Pertinenza
                    </Typography.Text>
                  </Flex>
                  <Typography.Text style={{ fontSize: 13, lineHeight: 1.6, color: '#262626' }}>
                    {article.ai_relevance_comment}
                  </Typography.Text>
                </div>
              )}
            </Section>
          )}

          {/* ---- Tags ---- */}
          <Section label="Tags">
            <Flex wrap="wrap" gap={6} align="center">
              {article.tags?.map((tag) => (
                <Tag key={tag.id} icon={<TagsOutlined />}>
                  {tag.name}
                </Tag>
              ))}
              {!article.tags?.length && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Nessun tag
                </Typography.Text>
              )}

              {/* ---- Add tag inline (hidden in readOnly) ---- */}
              {!readOnly &&
                (tagSelectOpen ? (
                  <Select
                    autoFocus
                    mode="multiple"
                    placeholder="Seleziona tag..."
                    size="small"
                    style={{ minWidth: 180 }}
                    options={availableTagOptions}
                    onBlur={() => setTagSelectOpen(false)}
                    onChange={(selectedIds: number[]) => {
                      if (selectedIds.length > 0) {
                        tagMutation.mutate(selectedIds);
                      }
                    }}
                    loading={tagMutation.isPending}
                  />
                ) : (
                  <Tag
                    onClick={() => setTagSelectOpen(true)}
                    style={{
                      borderStyle: 'dashed',
                      cursor: 'pointer',
                      color: '#1890ff',
                      borderColor: '#1890ff',
                    }}
                  >
                    <PlusOutlined /> Aggiungi
                  </Tag>
                ))}
            </Flex>
          </Section>

          {/* ---- Categories ---- */}
          <Section label="Categorie">
            <Flex wrap="wrap" gap={6} align="center">
              {article.categories?.map((cat) => (
                <Tag key={cat.id} icon={<FolderOutlined />}>
                  {cat.name}
                </Tag>
              ))}
              {!article.categories?.length && (
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Nessuna categoria
                </Typography.Text>
              )}

              {/* ---- Add category inline (hidden in readOnly) ---- */}
              {!readOnly &&
                (catSelectOpen ? (
                  <Select
                    autoFocus
                    mode="multiple"
                    placeholder="Seleziona categorie..."
                    size="small"
                    style={{ minWidth: 180 }}
                    options={availableCatOptions}
                    onBlur={() => setCatSelectOpen(false)}
                    onChange={(selectedIds: number[]) => {
                      if (selectedIds.length > 0) {
                        categoryMutation.mutate(selectedIds);
                      }
                    }}
                    loading={categoryMutation.isPending}
                  />
                ) : (
                  <Tag
                    onClick={() => setCatSelectOpen(true)}
                    style={{
                      borderStyle: 'dashed',
                      cursor: 'pointer',
                      color: '#1890ff',
                      borderColor: '#1890ff',
                    }}
                  >
                    <PlusOutlined /> Aggiungi
                  </Tag>
                ))}
            </Flex>
          </Section>

          {/* ---- Cover Image ---- */}
          {(article.featured_image_url || !readOnly) && (
            <Section label="Immagine di copertina">
              {article.featured_image_url ? (
                <div>
                  <img
                    src={article.featured_image_url}
                    alt="Copertina"
                    style={{
                      maxWidth: '100%',
                      maxHeight: 180,
                      borderRadius: 8,
                      objectFit: 'cover',
                      display: 'block',
                      marginBottom: readOnly ? 0 : 8,
                    }}
                  />
                  {!readOnly && (
                    <Space size="small">
                      <Upload
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        showUploadList={false}
                        beforeUpload={(file) => {
                          uploadImageMutation.mutate(
                            { id: article.id, file },
                            {
                              onSuccess: () => message.success('Immagine aggiornata'),
                              onError: () => message.error("Errore nell'upload"),
                            },
                          );
                          return false;
                        }}
                      >
                        <Button
                          size="small"
                          icon={<UploadOutlined />}
                          loading={uploadImageMutation.isPending}
                        >
                          Cambia
                        </Button>
                      </Upload>
                      <Button
                        size="small"
                        icon={<PictureOutlined />}
                        onClick={() => setUnsplashOpen(true)}
                      >
                        Unsplash
                      </Button>
                      <Button
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => {
                          updateArticleMutation.mutate(
                            { id: article.id, data: { featured_image_url: null } },
                            {
                              onSuccess: () => message.success('Immagine rimossa'),
                              onError: () => message.error('Errore nella rimozione'),
                            },
                          );
                        }}
                        loading={updateArticleMutation.isPending}
                      >
                        Rimuovi
                      </Button>
                    </Space>
                  )}
                </div>
              ) : (
                <Flex vertical gap={8}>
                  <Upload.Dragger
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    showUploadList={false}
                    beforeUpload={(file) => {
                      uploadImageMutation.mutate(
                        { id: article.id, file },
                        {
                          onSuccess: () => message.success('Immagine caricata'),
                          onError: () => message.error("Errore nell'upload"),
                        },
                      );
                      return false;
                    }}
                    style={{ padding: '12px 0' }}
                  >
                    <p style={{ margin: 0, color: '#8c8c8c' }}>
                      <PictureOutlined
                        style={{ fontSize: 24, display: 'block', marginBottom: 4 }}
                      />
                      Clicca o trascina un'immagine
                    </p>
                  </Upload.Dragger>
                  <Button block icon={<SearchOutlined />} onClick={() => setUnsplashOpen(true)}>
                    Cerca su Unsplash
                  </Button>
                </Flex>
              )}
              {!readOnly && (
                <ImagePickerModal
                  open={unsplashOpen}
                  onClose={() => setUnsplashOpen(false)}
                  articleTitle={article.title}
                  onSelect={(imageUrl) => {
                    updateArticleMutation.mutate(
                      { id: article.id, data: { featured_image_url: imageUrl } },
                      {
                        onSuccess: () => message.success('Immagine da Unsplash impostata'),
                        onError: () => message.error("Errore nell'impostare l'immagine"),
                      },
                    );
                  }}
                />
              )}
            </Section>
          )}

          {/* ---- Content preview ---- */}
          <Section label={translation ? 'Anteprima contenuto (tradotto)' : 'Anteprima contenuto'}>
            <div
              style={{
                background: '#fafafa',
                borderRadius: 8,
                padding: 16,
                border: '1px solid #f0f0f0',
              }}
            >
              <Typography.Paragraph
                type="secondary"
                style={{
                  whiteSpace: 'pre-wrap',
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                {translation?.text || truncate(article.content_text)}
              </Typography.Paragraph>
            </div>
          </Section>
        </div>

        {/* ---- Sticky footer actions ---- */}
        {!readOnly && (
          <div
            style={{
              padding: '12px 24px',
              borderTop: '1px solid #f0f0f0',
              background: '#fff',
            }}
          >
            <Flex justify="space-between" align="center">
              <Dropdown menu={{ items: statusMenuItems }} trigger={['click']}>
                <Button icon={<SwapOutlined />}>Cambia Stato</Button>
              </Dropdown>
              <Button type="link" icon={<ArrowRightOutlined />} onClick={handleViewFull}>
                Dettaglio completo
              </Button>
            </Flex>
          </div>
        )}
      </div>
    </Drawer>
  );
}

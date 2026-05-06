// ---------------------------------------------------------------------------
// PublicationVersion.tsx
//
// Sezione "Versione per pubblicazione" del dettaglio articolo.
// Permette di:
//  - generare con AI (Ollama) un titolo e un estratto riformulati
//    (no-copyright) da pubblicare su WordPress
//  - modificare manualmente i risultati
//  - salvarli sul DB (campi Article.published_title / published_excerpt)
//
// In WordPress, al momento del publish, il backend antepone l'estratto e
// chiude con una CTA al link dell'articolo originale.
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';

import { Alert, Button, Input, Modal, Space, Tag, theme as antdTheme, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { BookOpen, Eye, Save, Sparkles } from 'lucide-react';

import { queryKeys } from '@/config/queryKeys';
import { useToast } from '@/hooks/useToast';
import { generateForPublication, updateArticle } from '@/services/api/articles.api';
import type { Article, ArticleUpdate } from '@/types';
import { estimateReadingTime, formatReadingTimeShort } from '@/utils/readingTime';

interface PublicationVersionProps {
  article: Article;
}

const EXCERPT_MIN = 2000;
const EXCERPT_MAX = 2500;

export default function PublicationVersion({ article }: PublicationVersionProps) {
  const { token } = antdTheme.useToken();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [title, setTitle] = useState(article.published_title ?? '');
  const [excerpt, setExcerpt] = useState(article.published_excerpt ?? '');
  const [previewOpen, setPreviewOpen] = useState(false);

  // Allinea lo stato locale ai dati appena arrivati dal server (es. dopo
  // generate o dopo un fetch refresh) senza distruggere edit non salvati
  // dell'utente (per quello c'è il pulsante "Salva").
  useEffect(() => {
    setTitle(article.published_title ?? '');
    setExcerpt(article.published_excerpt ?? '');
  }, [article.id, article.published_title, article.published_excerpt]);

  const generateMutation = useMutation({
    mutationFn: () => generateForPublication(article.id),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.articles.detail(article.id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
      toast.success('Versione per pubblicazione generata');
    },
    onError: (err) => toast.error(err),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ArticleUpdate) => updateArticle(article.id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.articles.detail(article.id), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.lists() });
      toast.success('Versione per pubblicazione salvata');
    },
    onError: (err) => toast.error(err),
  });

  const isDirty = useMemo(() => {
    return (
      title !== (article.published_title ?? '') || excerpt !== (article.published_excerpt ?? '')
    );
  }, [title, excerpt, article.published_title, article.published_excerpt]);

  const excerptLen = excerpt.trim().length;
  const excerptInRange = excerptLen >= EXCERPT_MIN && excerptLen <= EXCERPT_MAX;

  const canSave =
    isDirty &&
    title.trim().length > 0 &&
    excerptLen > 0 &&
    !saveMutation.isPending &&
    !generateMutation.isPending;

  const handleSave = () => {
    saveMutation.mutate({
      published_title: title.trim() || null,
      published_excerpt: excerpt.trim() || null,
    });
  };

  const hasContent = !!article.published_title || !!article.published_excerpt;

  // Preview: usa il testo attualmente in editor (così l'utente vede subito
  // l'effetto delle modifiche locali, anche prima di salvare).
  const previewTitle = title.trim() || article.title;
  const previewExcerpt = excerpt.trim();
  const canPreview = previewTitle.length > 0 && previewExcerpt.length > 0;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Sparkles size={16} color={token.colorPrimary} />
          <Typography.Text type="secondary" style={{ fontSize: 12.5 }}>
            Versione no-copyright per WordPress
          </Typography.Text>
          {hasContent && (
            <Tag color="green" style={{ marginLeft: 4 }}>
              pronta
            </Tag>
          )}
        </div>
        <Space size={8}>
          <Button
            icon={<Eye size={14} />}
            onClick={() => setPreviewOpen(true)}
            disabled={!canPreview}
            style={{ borderRadius: 8, height: 36, fontWeight: 500 }}
          >
            Vedi preview
          </Button>
          <Button
            icon={<Sparkles size={14} />}
            type="primary"
            onClick={() => generateMutation.mutate()}
            loading={generateMutation.isPending}
            style={{ borderRadius: 8, height: 36, fontWeight: 500 }}
          >
            {hasContent ? 'Rigenera con AI' : 'Genera per pubblicazione'}
          </Button>
        </Space>
      </div>

      <Typography.Paragraph
        type="secondary"
        style={{ fontSize: 12.5, marginBottom: 14, lineHeight: 1.55 }}
      >
        Titolo riformulato e riassunto pronti per WordPress (no copyright). In pubblicazione verrà
        aggiunta automaticamente in coda una CTA al link dell&apos;articolo originale. Sono entrambi
        modificabili manualmente.
      </Typography.Paragraph>

      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 600,
            color: token.colorTextSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          Titolo
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titolo riformulato per la pubblicazione"
          maxLength={200}
          size="large"
          showCount
          disabled={generateMutation.isPending}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            display: 'block',
            marginBottom: 6,
            fontSize: 12,
            fontWeight: 600,
            color: token.colorTextSecondary,
            textTransform: 'uppercase',
            letterSpacing: 0.4,
          }}
        >
          Estratto
        </label>
        <Input.TextArea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Riassunto/estratto (2000-2500 caratteri)"
          autoSize={{ minRows: 10, maxRows: 22 }}
          maxLength={EXCERPT_MAX}
          showCount
          disabled={generateMutation.isPending}
        />
        {excerptLen > 0 && !excerptInRange && (
          <Typography.Text
            type={excerptLen < EXCERPT_MIN ? 'warning' : 'danger'}
            style={{ fontSize: 11, marginTop: 4, display: 'block' }}
          >
            {excerptLen < EXCERPT_MIN
              ? `L'estratto è molto breve (${excerptLen} caratteri).`
              : `L'estratto supera il limite consigliato (${excerptLen}/${EXCERPT_MAX}).`}
          </Typography.Text>
        )}

        {excerptLen > 0 && (
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 11,
              marginTop: 4,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <BookOpen size={11} aria-hidden="true" />≈{' '}
            {formatReadingTimeShort(estimateReadingTime(excerpt))} lettura
          </Typography.Text>
        )}
      </div>

      {generateMutation.isError && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          message="Generazione non riuscita"
          description={(generateMutation.error as Error)?.message ?? 'Riprova tra qualche istante.'}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          icon={<Save size={14} />}
          onClick={handleSave}
          disabled={!canSave}
          loading={saveMutation.isPending}
          style={{ borderRadius: 8, height: 36, fontWeight: 500 }}
        >
          Salva
        </Button>
      </div>

      <PublicationPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTitle}
        excerpt={previewExcerpt}
        canonicalUrl={article.canonical_url}
        sourceDomain={article.source_domain}
        featuredImageUrl={article.featured_image_url}
        publishedAt={article.published_at}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// PublicationPreviewModal
//
// Mostra un'anteprima fedele a quanto WordPress riceverà:
//   - title  →  article.published_title (fallback article.title)
//   - body   →  excerpt convertito in <p> (mirror di _text_to_html backend)
//              + CTA finale al canonical_url (stesso markup di
//                wordpress_service.publish_to_wordpress)
//   - featured image opzionale per dare contesto visivo
// ---------------------------------------------------------------------------

interface PublicationPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  excerpt: string;
  canonicalUrl: string;
  sourceDomain: string;
  featuredImageUrl: string | null;
  publishedAt: string | null;
}

function excerptToHtml(text: string): string {
  // Mirror di backend _text_to_html: \n\n separa <p>, \n diventa <br>.
  const paragraphs = text.split('\n\n');
  return paragraphs
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>\n')}</p>`)
    .join('\n\n');
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function PublicationPreviewModal({
  open,
  onClose,
  title,
  excerpt,
  canonicalUrl,
  sourceDomain,
  featuredImageUrl,
  publishedAt,
}: PublicationPreviewModalProps) {
  const { token } = antdTheme.useToken();
  const readingMin = estimateReadingTime(excerpt);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={780}
      title="Anteprima — come apparirà su WordPress"
      destroyOnClose
    >
      <div
        style={{
          background: '#ffffff',
          color: '#1f1f1f',
          borderRadius: 8,
          padding: '32px 36px',
          border: `1px solid ${token.colorBorderSecondary}`,
          fontFamily: '"Georgia", "Times New Roman", serif',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        <Typography.Text
          style={{
            display: 'block',
            fontSize: 11,
            fontFamily: 'var(--font-family-base)',
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: '#8c8c8c',
            marginBottom: 12,
          }}
        >
          {sourceDomain}
          {publishedAt ? ` · ${dayjs(publishedAt).format('DD MMM YYYY')}` : ''}
          {readingMin > 0 ? ` · ${formatReadingTimeShort(readingMin)} lettura` : ''}
        </Typography.Text>

        <h1
          style={{
            fontSize: 30,
            lineHeight: 1.25,
            margin: '0 0 18px',
            fontWeight: 700,
            color: '#111',
          }}
        >
          {title}
        </h1>

        {featuredImageUrl && (
          <img
            src={featuredImageUrl}
            alt=""
            style={{
              width: '100%',
              maxHeight: 360,
              objectFit: 'cover',
              borderRadius: 6,
              marginBottom: 20,
            }}
          />
        )}

        <div
          style={{
            fontSize: 17,
            lineHeight: 1.7,
            color: '#262626',
          }}
          // Mostriamo l'HTML come lo riceverà WP. È sempre HTML che generiamo
          // noi (escape applicato sopra), non contenuto utente esterno.
          dangerouslySetInnerHTML={{ __html: excerptToHtml(excerpt) }}
        />

        <p style={{ marginTop: '1.5em', fontSize: 16, lineHeight: 1.6 }}>
          <a
            href={canonicalUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: token.colorPrimary,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Leggi l&apos;articolo completo sulla fonte originale &rarr;
          </a>
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 14,
          fontSize: 12,
          color: token.colorTextTertiary,
        }}
      >
        <span>
          La CTA finale viene aggiunta automaticamente in pubblicazione. Il rendering esatto può
          variare in base al tema WordPress.
        </span>
        <Button onClick={onClose} style={{ borderRadius: 8 }}>
          Chiudi
        </Button>
      </div>
    </Modal>
  );
}

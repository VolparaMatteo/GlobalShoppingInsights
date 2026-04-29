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

import { Alert, Button, Input, Space, Tag, theme as antdTheme, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Sparkles } from 'lucide-react';

import { queryKeys } from '@/config/queryKeys';
import { useToast } from '@/hooks/useToast';
import { generateForPublication, updateArticle } from '@/services/api/articles.api';
import type { Article, ArticleUpdate } from '@/types';

interface PublicationVersionProps {
  article: Article;
}

const EXCERPT_MIN = 60;
const EXCERPT_MAX = 1200;

export default function PublicationVersion({ article }: PublicationVersionProps) {
  const { token } = antdTheme.useToken();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [title, setTitle] = useState(article.published_title ?? '');
  const [excerpt, setExcerpt] = useState(article.published_excerpt ?? '');

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
    return title !== (article.published_title ?? '') || excerpt !== (article.published_excerpt ?? '');
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

  return (
    <div
      style={{
        background: token.colorBgContainer,
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: 'var(--shadow-sm)',
        padding: '20px 22px',
        marginTop: 16,
      }}
    >
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
          <Sparkles size={18} color={token.colorPrimary} />
          <Typography.Text strong style={{ fontSize: 15, color: token.colorText }}>
            Versione per pubblicazione
          </Typography.Text>
          {hasContent && (
            <Tag color="green" style={{ marginLeft: 4 }}>
              pronta
            </Tag>
          )}
        </div>
        <Space size={8}>
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
          placeholder="Riassunto/estratto (120-160 parole consigliate)"
          autoSize={{ minRows: 6, maxRows: 14 }}
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
    </div>
  );
}

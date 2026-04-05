// ---------------------------------------------------------------------------
// ArticleMetadata.tsx  --  Sidebar metadata card
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { Button, Card, Flex, message, Space, Tag, Typography, Upload } from 'antd';
import {
  LinkOutlined,
  GlobalOutlined,
  TranslationOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  LockOutlined,
  PictureOutlined,
  SearchOutlined,
  UnlockOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Article } from '@/types';
import { useUpdateArticle, useUploadArticleImage } from '@/hooks/queries/useArticle';
import ImagePickerModal from '@/components/common/ImagePickerModal';

interface ArticleMetadataProps {
  article: Article;
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Flex
      justify="space-between"
      align="center"
      style={{
        padding: '8px 0',
        borderBottom: '1px solid #fafafa',
        fontSize: 13,
      }}
    >
      <Flex align="center" gap={6} style={{ color: '#8c8c8c' }}>
        {icon}
        <span>{label}</span>
      </Flex>
      <div style={{ color: '#262626', textAlign: 'right', maxWidth: '60%' }}>
        {children}
      </div>
    </Flex>
  );
}

export default function ArticleMetadata({ article }: ArticleMetadataProps) {
  const [unsplashOpen, setUnsplashOpen] = useState(false);
  const updateArticleMutation = useUpdateArticle();
  const uploadImageMutation = useUploadArticleImage();

  return (
    <>
      <Card title="Informazioni" size="small" style={{ marginBottom: 16 }}>
        <MetaRow icon={<LinkOutlined />} label="URL">
          <Typography.Link
            href={article.canonical_url}
            target="_blank"
            rel="noopener noreferrer"
            ellipsis
            style={{ maxWidth: 160, fontSize: 13 }}
          >
            {article.source_domain}
          </Typography.Link>
        </MetaRow>

        <MetaRow icon={<TranslationOutlined />} label="Lingua">
          <Tag style={{ margin: 0 }}>{article.language.toUpperCase()}</Tag>
        </MetaRow>

        <MetaRow icon={<EnvironmentOutlined />} label="Paese">
          {article.country ?? '—'}
        </MetaRow>

        <MetaRow icon={<CalendarOutlined />} label="Pubblicato">
          {article.published_at
            ? dayjs(article.published_at).format('DD/MM/YY')
            : '—'}
        </MetaRow>

        <MetaRow icon={<ClockCircleOutlined />} label="Importato">
          {dayjs(article.created_at).format('DD/MM/YY')}
        </MetaRow>

        <MetaRow icon={<ClockCircleOutlined />} label="Aggiornato">
          {dayjs(article.updated_at).format('DD/MM/YY')}
        </MetaRow>

        <MetaRow
          icon={article.is_paywalled ? <LockOutlined /> : <UnlockOutlined />}
          label="Paywall"
        >
          <Tag color={article.is_paywalled ? 'warning' : 'success'} style={{ margin: 0 }}>
            {article.is_paywalled ? 'Si' : 'No'}
          </Tag>
        </MetaRow>
      </Card>

      <Card title="Immagine di copertina" size="small" style={{ marginBottom: 16 }}>
        {article.featured_image_url ? (
          <div>
            <img
              src={article.featured_image_url}
              alt="Copertina"
              style={{
                width: '100%',
                maxHeight: 200,
                borderRadius: 8,
                objectFit: 'cover',
                display: 'block',
                marginBottom: 8,
              }}
            />
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
            >
              <p style={{ margin: 0, color: '#8c8c8c' }}>
                <PictureOutlined style={{ fontSize: 24, display: 'block', marginBottom: 4 }} />
                Clicca o trascina un'immagine
              </p>
            </Upload.Dragger>
            <Button
              block
              icon={<SearchOutlined />}
              onClick={() => setUnsplashOpen(true)}
            >
              Cerca su Unsplash
            </Button>
          </Flex>
        )}
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
      </Card>
    </>
  );
}

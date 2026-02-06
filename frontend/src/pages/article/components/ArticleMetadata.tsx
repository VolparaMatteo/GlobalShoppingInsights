// ---------------------------------------------------------------------------
// ArticleMetadata.tsx  --  Sidebar metadata card
// ---------------------------------------------------------------------------
import React from 'react';
import { Card, Descriptions, Tag, Typography } from 'antd';
import {
  LinkOutlined,
  GlobalOutlined,
  TranslationOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  LockOutlined,
  UnlockOutlined,
} from '@ant-design/icons';
import type { Article } from '@/types';
import { formatDate, formatDateTime } from '@/utils/date';

interface ArticleMetadataProps {
  article: Article;
}

export default function ArticleMetadata({ article }: ArticleMetadataProps) {
  return (
    <Card title="Metadata" size="small" style={{ marginBottom: 16 }}>
      <Descriptions column={1} size="small" colon={false}>
        <Descriptions.Item
          label={
            <span>
              <LinkOutlined style={{ marginRight: 4 }} />
              URL
            </span>
          }
        >
          <Typography.Link
            href={article.canonical_url}
            target="_blank"
            rel="noopener noreferrer"
            ellipsis
            style={{ maxWidth: 180 }}
          >
            {article.canonical_url}
          </Typography.Link>
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <span>
              <GlobalOutlined style={{ marginRight: 4 }} />
              Source
            </span>
          }
        >
          {article.source_domain}
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <span>
              <TranslationOutlined style={{ marginRight: 4 }} />
              Language
            </span>
          }
        >
          <Tag>{article.language.toUpperCase()}</Tag>
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <span>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              Country
            </span>
          }
        >
          {article.country ?? '-'}
        </Descriptions.Item>

        <Descriptions.Item
          label={
            <span>
              <CalendarOutlined style={{ marginRight: 4 }} />
              Published
            </span>
          }
        >
          {formatDate(article.published_at)}
        </Descriptions.Item>

        <Descriptions.Item label="Created">
          {formatDateTime(article.created_at)}
        </Descriptions.Item>

        <Descriptions.Item label="Updated">
          {formatDateTime(article.updated_at)}
        </Descriptions.Item>

        <Descriptions.Item label="Paywalled">
          {article.is_paywalled ? (
            <Tag icon={<LockOutlined />} color="warning">
              Yes
            </Tag>
          ) : (
            <Tag icon={<UnlockOutlined />} color="success">
              No
            </Tag>
          )}
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
}

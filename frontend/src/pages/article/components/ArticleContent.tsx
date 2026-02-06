// ---------------------------------------------------------------------------
// ArticleContent.tsx  --  Sanitized article content display
// ---------------------------------------------------------------------------
import React from 'react';
import { Card, Button, Image } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { Article } from '@/types';
import SafeHTML from '@/components/common/SafeHTML';

interface ArticleContentProps {
  article: Article;
  onEditClick?: () => void;
}

export default function ArticleContent({ article, onEditClick }: ArticleContentProps) {
  const hasContent = article.content_html || article.content_text;

  return (
    <Card
      title="Content"
      extra={
        onEditClick && (
          <Button type="link" icon={<EditOutlined />} onClick={onEditClick}>
            Edit
          </Button>
        )
      }
      style={{ marginBottom: 16 }}
    >
      {/* Featured image */}
      {article.featured_image_url && (
        <div style={{ marginBottom: 16, textAlign: 'center' }}>
          <Image
            src={article.featured_image_url}
            alt={article.title}
            style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg=="
          />
        </div>
      )}

      {/* HTML content */}
      {article.content_html ? (
        <SafeHTML html={article.content_html} className="article-body" />
      ) : article.content_text ? (
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
          {article.content_text}
        </div>
      ) : (
        <div style={{ color: '#999', fontStyle: 'italic' }}>
          No content available for this article.
        </div>
      )}
    </Card>
  );
}

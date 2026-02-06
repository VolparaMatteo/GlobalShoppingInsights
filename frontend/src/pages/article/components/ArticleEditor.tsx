// ---------------------------------------------------------------------------
// ArticleEditor.tsx  --  Inline article content editor
// ---------------------------------------------------------------------------
import React, { useState } from 'react';
import { Card, Input, Button, Space, message } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Article, ArticleUpdate } from '@/types';
import { updateArticle } from '@/services/api/articles.api';
import { queryKeys } from '@/config/queryKeys';

interface ArticleEditorProps {
  article: Article;
  onSave?: (updated: Article) => void;
  onCancel: () => void;
}

export default function ArticleEditor({ article, onSave, onCancel }: ArticleEditorProps) {
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content_text ?? article.content_html ?? '');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: ArticleUpdate) => updateArticle(article.id, payload),
    onSuccess: (updated) => {
      message.success('Article saved successfully.');
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(article.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.revisions(article.id) });
      onSave?.(updated);
    },
    onError: () => {
      message.error('Failed to save article. Please try again.');
    },
  });

  const handleSave = () => {
    const payload: ArticleUpdate = {};

    if (title !== article.title) {
      payload.title = title;
    }

    const originalContent = article.content_text ?? article.content_html ?? '';
    if (content !== originalContent) {
      payload.content_text = content;
    }

    // Only send if there are actual changes
    if (Object.keys(payload).length === 0) {
      message.info('No changes to save.');
      onCancel();
      return;
    }

    mutation.mutate(payload);
  };

  return (
    <Card
      title="Edit Article"
      extra={
        <Space>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={mutation.isPending}
          >
            Save
          </Button>
          <Button
            icon={<CloseOutlined />}
            onClick={onCancel}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Article title"
          size="large"
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Content</label>
        <Input.TextArea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Article content..."
          rows={16}
          showCount
        />
      </div>
    </Card>
  );
}

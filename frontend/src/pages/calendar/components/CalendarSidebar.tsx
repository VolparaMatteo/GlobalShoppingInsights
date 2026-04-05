// ---------------------------------------------------------------------------
// CalendarSidebar.tsx  --  Sidebar con articoli approvati pronti da pianificare
// ---------------------------------------------------------------------------
import React, { useMemo, useState } from 'react';
import { Input, Typography, Spin, Empty, Tag, Badge } from 'antd';
import { SearchOutlined, FileTextOutlined } from '@ant-design/icons';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { useArticles } from '@/hooks/queries/useArticles';
import type { Article } from '@/types';

// ---------------------------------------------------------------------------
// Sidebar article card (draggable)
// ---------------------------------------------------------------------------

interface DraggableArticleProps {
  article: Article;
}

function DraggableArticle({ article }: DraggableArticleProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `article-${article.id}`,
    data: { article },
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    cursor: 'grab',
    padding: '10px 12px',
    border: '1px solid #f0f0f0',
    borderRadius: 8,
    background: '#fff',
    marginBottom: 8,
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
    userSelect: 'none',
    transition: 'box-shadow 0.2s, border-color 0.2s',
  };

  const scoreColor =
    article.ai_score == null
      ? '#8c8c8c'
      : article.ai_score >= 75
        ? '#52c41a'
        : article.ai_score >= 50
          ? '#1677ff'
          : article.ai_score >= 25
            ? '#faad14'
            : '#ff4d4f';

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Typography.Text
        ellipsis
        style={{ display: 'block', fontWeight: 500, fontSize: 13 }}
      >
        {article.title}
      </Typography.Text>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          {article.source_domain}
        </Typography.Text>
        {article.ai_score != null && (
          <Tag color={scoreColor} style={{ margin: 0, fontSize: 10, lineHeight: '18px' }}>
            AI {article.ai_score}
          </Tag>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const sidebarStyle: React.CSSProperties = {
  width: 280,
  flexShrink: 0,
  background: '#fff',
  border: '1px solid #f0f0f0',
  borderRadius: 12,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'calc(100vh - 200px)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 16px 12px',
  borderBottom: '1px solid #f0f0f0',
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 10,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarSidebar() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useArticles({ status: 'approved', page_size: 50 });

  const articles: Article[] = useMemo(() => {
    const items = data?.items ?? [];
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.source_domain.toLowerCase().includes(q),
    );
  }, [data, search]);

  const totalCount = data?.items?.length ?? 0;

  return (
    <aside style={sidebarStyle}>
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Typography.Text strong style={{ fontSize: 14 }}>
            <FileTextOutlined style={{ marginRight: 6 }} />
            Pronti da pianificare
          </Typography.Text>
          <Badge count={totalCount} style={{ backgroundColor: '#52c41a' }} />
        </div>
        <Input
          placeholder="Filtra articoli..."
          prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
          size="small"
          allowClear
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div style={listStyle}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin size="small" />
          </div>
        ) : articles.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={search ? 'Nessun risultato' : 'Nessun articolo approvato'}
            style={{ marginTop: 32 }}
          />
        ) : (
          articles.map((article) => (
            <DraggableArticle key={article.id} article={article} />
          ))
        )}
      </div>
    </aside>
  );
}

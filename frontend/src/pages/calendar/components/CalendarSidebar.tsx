// ---------------------------------------------------------------------------
// CalendarSidebar.tsx  --  Left sidebar with approved articles ready to schedule
// ---------------------------------------------------------------------------
import React, { useMemo, useState } from 'react';
import { Input, Typography, Spin, Empty } from 'antd';
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
    padding: '8px 10px',
    border: '1px solid #f0f0f0',
    borderRadius: 6,
    background: '#fff',
    marginBottom: 6,
    boxShadow: isDragging ? '0 4px 12px rgba(0,0,0,0.12)' : '0 1px 2px rgba(0,0,0,0.04)',
    userSelect: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <Typography.Text
        ellipsis
        style={{ display: 'block', fontWeight: 500, fontSize: 13 }}
      >
        {article.title}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
        {article.source_domain}
      </Typography.Text>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const sidebarStyle: React.CSSProperties = {
  width: 260,
  flexShrink: 0,
  background: '#fff',
  border: '1px solid #f0f0f0',
  borderRadius: 6,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: 'calc(100vh - 180px)',
};

const headerStyle: React.CSSProperties = {
  padding: '12px 12px 8px',
  borderBottom: '1px solid #f0f0f0',
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 8,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CalendarSidebar() {
  const [search, setSearch] = useState('');

  // Fetch approved articles that are ready to be scheduled
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

  return (
    <aside style={sidebarStyle}>
      <div style={headerStyle}>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          <FileTextOutlined style={{ marginRight: 6 }} />
          Ready to Schedule
        </Typography.Text>
        <Input
          placeholder="Filter articles..."
          prefix={<SearchOutlined />}
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
            description="No approved articles"
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

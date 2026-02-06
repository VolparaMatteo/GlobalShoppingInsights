// ---------------------------------------------------------------------------
// ArticleHeader.tsx  --  Article detail page header
// ---------------------------------------------------------------------------
import React, { useState } from 'react';
import { Typography, Space, Input, Tag, Button } from 'antd';
import {
  EditOutlined,
  GlobalOutlined,
  UserOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import type { Article } from '@/types';
import { STATUS_MAP, type ArticleStatus } from '@/config/constants';
import { formatDate } from '@/utils/date';

interface ArticleHeaderProps {
  article: Article;
  onEdit?: (title: string) => void;
}

export default function ArticleHeader({ article, onEdit }: ArticleHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(article.title);

  const statusMeta = STATUS_MAP[article.status as ArticleStatus];

  const handleSaveTitle = () => {
    if (onEdit && editTitle.trim()) {
      onEdit(editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(article.title);
    setIsEditing(false);
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        {isEditing ? (
          <Space direction="vertical" style={{ flex: 1 }}>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onPressEnter={handleSaveTitle}
              size="large"
              autoFocus
            />
            <Space>
              <Button size="small" type="primary" onClick={handleSaveTitle}>
                Save
              </Button>
              <Button size="small" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </Space>
          </Space>
        ) : (
          <Typography.Title level={3} style={{ margin: 0, flex: 1 }}>
            {article.title}
            {onEdit && (
              <Button
                type="text"
                icon={<EditOutlined />}
                size="small"
                onClick={() => setIsEditing(true)}
                style={{ marginLeft: 8 }}
              />
            )}
          </Typography.Title>
        )}

        {/* Status badge */}
        {statusMeta && (
          <Tag
            color={statusMeta.color}
            style={{ backgroundColor: statusMeta.bgColor, marginTop: 4 }}
          >
            {statusMeta.label}
          </Tag>
        )}
      </div>

      {/* Meta row */}
      <Space size="middle" wrap>
        <Space size={4}>
          <GlobalOutlined />
          <a href={article.canonical_url} target="_blank" rel="noopener noreferrer">
            {article.source_domain}
          </a>
        </Space>

        {article.author && (
          <Space size={4}>
            <UserOutlined />
            <Typography.Text>{article.author}</Typography.Text>
          </Space>
        )}

        {article.published_at && (
          <Space size={4}>
            <CalendarOutlined />
            <Typography.Text type="secondary">
              {formatDate(article.published_at)}
            </Typography.Text>
          </Space>
        )}

        <Tag>{article.language.toUpperCase()}</Tag>
      </Space>
    </div>
  );
}

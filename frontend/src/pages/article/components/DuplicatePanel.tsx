// ---------------------------------------------------------------------------
// DuplicatePanel.tsx  --  Sidebar card listing potential duplicate articles
// ---------------------------------------------------------------------------
import React from 'react';
import { Card, List, Typography, Tag, Space, Empty, Spin } from 'antd';
import { CopyOutlined, LinkOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getDuplicates } from '@/services/api/articles.api';
import { buildArticleDetailPath } from '@/config/routes';

interface DuplicatePanelProps {
  articleId: number;
}

export default function DuplicatePanel({ articleId }: DuplicatePanelProps) {
  const { data: duplicates, isLoading } = useQuery({
    queryKey: ['articles', 'duplicates', String(articleId)],
    queryFn: () => getDuplicates(articleId),
  });

  return (
    <Card
      title={
        <Space>
          <CopyOutlined />
          Potential Duplicates
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Spin size="small" />
        </div>
      ) : !duplicates || duplicates.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No duplicates found"
        />
      ) : (
        <List
          size="small"
          dataSource={duplicates}
          renderItem={(dup) => (
            <List.Item style={{ padding: '8px 0' }}>
              <div style={{ width: '100%' }}>
                <Link to={buildArticleDetailPath(dup.id)}>
                  <Typography.Text ellipsis style={{ display: 'block', maxWidth: '100%' }}>
                    <LinkOutlined style={{ marginRight: 4 }} />
                    {dup.title}
                  </Typography.Text>
                </Link>
                <Space size={4} style={{ marginTop: 4 }}>
                  <Tag>{dup.source_domain}</Tag>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    {dup.language.toUpperCase()}
                  </Typography.Text>
                </Space>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

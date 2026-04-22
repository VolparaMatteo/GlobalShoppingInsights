// ---------------------------------------------------------------------------
// RevisionHistory.tsx  --  Sidebar card with article revision timeline
// ---------------------------------------------------------------------------
import React from 'react';
import { Card, Timeline, Typography, Tag, Space, Empty, Spin } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getRevisions } from '@/services/api/articles.api';
import { queryKeys } from '@/config/queryKeys';
import { formatDateTime } from '@/utils/date';

interface RevisionHistoryProps {
  articleId: number;
}

export default function RevisionHistory({ articleId }: RevisionHistoryProps) {
  const { data: revisions, isLoading } = useQuery({
    queryKey: queryKeys.articles.revisions(articleId),
    queryFn: () => getRevisions(articleId),
  });

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined />
          Revision History
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 16 }}>
          <Spin size="small" />
        </div>
      ) : !revisions || revisions.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No revisions yet" />
      ) : (
        <Timeline
          items={revisions.map((rev) => ({
            key: rev.id,
            children: (
              <div>
                <div style={{ marginBottom: 4 }}>
                  <Tag color="blue">v{rev.version}</Tag>
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Editor #{rev.editor_id}
                  </Typography.Text>
                </div>
                <div style={{ marginBottom: 4 }}>
                  {rev.changes.map((change, idx) => (
                    <Typography.Text
                      key={idx}
                      type="secondary"
                      style={{ display: 'block', fontSize: 12 }}
                    >
                      Changed <strong>{change.field}</strong>
                    </Typography.Text>
                  ))}
                </div>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  {formatDateTime(rev.created_at)}
                </Typography.Text>
              </div>
            ),
          }))}
        />
      )}
    </Card>
  );
}

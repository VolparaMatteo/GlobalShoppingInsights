// ---------------------------------------------------------------------------
// AIScorePanel.tsx  --  Sidebar card for AI relevance score & suggestions
// ---------------------------------------------------------------------------
import React from 'react';
import { Card, Progress, Tag, List, Typography, Space, Empty } from 'antd';
import { RobotOutlined, TagsOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { Article } from '@/types';
import { SCORE_THRESHOLDS } from '@/config/constants';

interface AIScorePanelProps {
  article: Article;
}

function getScoreColor(score: number): string {
  if (score >= SCORE_THRESHOLDS.high) return '#52c41a';
  if (score >= SCORE_THRESHOLDS.medium) return '#faad14';
  return '#ff4d4f';
}

export default function AIScorePanel({ article }: AIScorePanelProps) {
  const hasScore = article.ai_score !== null && article.ai_score !== undefined;
  const score = article.ai_score ?? 0;

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          AI Analysis
        </Space>
      }
      size="small"
      style={{ marginBottom: 16 }}
    >
      {/* Score circle */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        {hasScore ? (
          <Progress
            type="circle"
            percent={score}
            strokeColor={getScoreColor(score)}
            format={(pct) => `${pct}`}
            size={100}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No AI score available"
          />
        )}
      </div>

      {/* Score explanation */}
      {article.ai_score_explanation && article.ai_score_explanation.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            Explanation
          </Typography.Text>
          <List
            size="small"
            dataSource={article.ai_score_explanation}
            renderItem={(item) => (
              <List.Item style={{ padding: '4px 0', border: 'none' }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {item}
                </Typography.Text>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* Suggested tags */}
      {article.ai_suggested_tags && article.ai_suggested_tags.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            <TagsOutlined style={{ marginRight: 4 }} />
            Suggested Tags
          </Typography.Text>
          <Space size={[4, 4]} wrap>
            {article.ai_suggested_tags.map((tag) => (
              <Tag key={tag} color="blue">
                {tag}
              </Tag>
            ))}
          </Space>
        </div>
      )}

      {/* Suggested category */}
      {article.ai_suggested_category && (
        <div>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            <AppstoreOutlined style={{ marginRight: 4 }} />
            Suggested Category
          </Typography.Text>
          <Tag color="purple">{article.ai_suggested_category}</Tag>
        </div>
      )}
    </Card>
  );
}

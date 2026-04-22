// ---------------------------------------------------------------------------
// AIScorePanel.tsx  --  Sidebar card for AI relevance score & analysis
// ---------------------------------------------------------------------------
import { Card, Empty, Flex, List, Progress, Space, Typography } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
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
          Analisi AI
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
            size={90}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Nessun punteggio disponibile" />
        )}
      </div>

      {/* Score explanation */}
      {article.ai_score_explanation && article.ai_score_explanation.length > 0 && (
        <Flex vertical gap={4}>
          {article.ai_score_explanation.map((reason, idx) => (
            <Typography.Text key={idx} type="secondary" style={{ fontSize: 12, lineHeight: 1.5 }}>
              &bull; {reason}
            </Typography.Text>
          ))}
        </Flex>
      )}

      {/* LLM Relevance Comment */}
      {article.ai_relevance_comment && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 12px',
            background: 'linear-gradient(135deg, #f0f5ff 0%, #e6f7ff 100%)',
            borderRadius: 8,
            border: '1px solid #d6e4ff',
          }}
        >
          <Flex align="center" gap={6} style={{ marginBottom: 6 }}>
            <RobotOutlined style={{ fontSize: 13, color: '#1890ff' }} />
            <Typography.Text strong style={{ fontSize: 12, color: '#1890ff' }}>
              Analisi di Pertinenza
            </Typography.Text>
          </Flex>
          <Typography.Text style={{ fontSize: 12, lineHeight: 1.6, color: '#262626' }}>
            {article.ai_relevance_comment}
          </Typography.Text>
        </div>
      )}
    </Card>
  );
}

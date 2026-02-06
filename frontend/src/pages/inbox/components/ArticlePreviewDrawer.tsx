// ---------------------------------------------------------------------------
// ArticlePreviewDrawer  --  Side-panel preview for a single article
// ---------------------------------------------------------------------------
import { Button, Descriptions, Divider, Drawer, Space, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import type { Article } from '@/types';
import { buildArticleDetailPath } from '@/config/routes';
import StatusBadge from '@/pages/inbox/components/StatusBadge';
import ScoreBadge from '@/pages/inbox/components/ScoreBadge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ArticlePreviewDrawerProps {
  article: Article | null;
  open: boolean;
  onClose: () => void;
  onQuickAction?: (articleId: number, action: 'screened' | 'rejected') => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Truncate plain-text content to the given character limit. */
function truncate(text: string | null | undefined, maxLen = 600): string {
  if (!text) return 'No content available.';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '...';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ArticlePreviewDrawer({
  article,
  open,
  onClose,
  onQuickAction,
}: ArticlePreviewDrawerProps) {
  const navigate = useNavigate();

  if (!article) return null;

  const handleViewFull = () => {
    onClose();
    navigate(buildArticleDetailPath(article.id));
  };

  return (
    <Drawer
      title="Article Preview"
      placement="right"
      width={520}
      open={open}
      onClose={onClose}
      extra={
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          onClick={handleViewFull}
        >
          View Full Article
        </Button>
      }
    >
      {/* ---- Header ---- */}
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        {article.title}
      </Typography.Title>

      <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
        <Descriptions.Item label="Source">
          {article.source_domain}
        </Descriptions.Item>
        <Descriptions.Item label="Published">
          {article.published_at
            ? dayjs(article.published_at).format('YYYY-MM-DD HH:mm')
            : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Status">
          <StatusBadge status={article.status} />
        </Descriptions.Item>
      </Descriptions>

      {/* ---- AI Score ---- */}
      <Divider orientation="left" plain>
        AI Score
      </Divider>
      <Space align="center" style={{ marginBottom: 8 }}>
        <ScoreBadge score={article.ai_score} />
      </Space>
      {article.ai_score_explanation && article.ai_score_explanation.length > 0 && (
        <ul style={{ paddingLeft: 20, margin: '8px 0 16px' }}>
          {article.ai_score_explanation.map((reason, idx) => (
            <li key={idx}>
              <Typography.Text type="secondary">{reason}</Typography.Text>
            </li>
          ))}
        </ul>
      )}

      {/* ---- Content Preview ---- */}
      <Divider orientation="left" plain>
        Content Preview
      </Divider>
      <Typography.Paragraph
        type="secondary"
        style={{ whiteSpace: 'pre-wrap' }}
      >
        {truncate(article.content_text)}
      </Typography.Paragraph>

      {/* ---- Quick Actions ---- */}
      <Divider />
      <Space>
        <Button
          type="primary"
          icon={<CheckCircleOutlined />}
          onClick={() => onQuickAction?.(article.id, 'screened')}
        >
          Screen
        </Button>
        <Button
          danger
          icon={<CloseCircleOutlined />}
          onClick={() => onQuickAction?.(article.id, 'rejected')}
        >
          Reject
        </Button>
      </Space>
    </Drawer>
  );
}

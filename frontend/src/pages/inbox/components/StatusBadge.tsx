// ---------------------------------------------------------------------------
// StatusBadge  --  Colour-coded badge for article workflow status
// ---------------------------------------------------------------------------
import { Tag } from 'antd';
import { STATUS_MAP, type ArticleStatus } from '@/config/constants';

interface StatusBadgeProps {
  status: string;
}

/** Map of status to Ant Design preset colour names. */
const STATUS_COLOR_MAP: Record<string, string> = {
  imported: 'blue',
  screened: 'cyan',
  in_review: 'orange',
  approved: 'green',
  scheduled: 'purple',
  publishing: 'gold',
  published: 'green',
  publish_failed: 'red',
  rejected: 'default',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_MAP[status as ArticleStatus];
  const label = meta?.label ?? status;
  const color = STATUS_COLOR_MAP[status] ?? 'default';

  return <Tag color={color}>{label}</Tag>;
}

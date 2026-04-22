// ---------------------------------------------------------------------------
// RecentJobsList.tsx  --  Modern recent jobs feed for the dashboard
// ---------------------------------------------------------------------------
import { Typography, Tag } from 'antd';
import {
  CheckCircleFilled,
  SyncOutlined,
  CloseCircleFilled,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useRecentJobs } from '@/hooks/queries/useDashboardKPIs';
import RelativeTime from '@/components/common/RelativeTime';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { CSSProperties } from 'react';

const { Text } = Typography;

function statusIcon(status: string) {
  switch (status) {
    case 'completed':
    case 'success':
      return <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />;
    case 'running':
    case 'in_progress':
      return <SyncOutlined spin style={{ color: '#1677ff', fontSize: 16 }} />;
    case 'failed':
    case 'error':
      return <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />;
    default:
      return <ClockCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />;
  }
}

function jobTypeLabel(type: string) {
  const map: Record<string, { label: string; color: string }> = {
    discovery: { label: 'Scoperta', color: 'blue' },
    publish: { label: 'Pubblicazione', color: 'green' },
    scrape: { label: 'Scraping', color: 'cyan' },
    ai_score: { label: 'Punteggio AI', color: 'purple' },
  };
  const m = map[type] || { label: type, color: 'default' };
  return (
    <Tag color={m.color} style={{ fontSize: 11, lineHeight: '18px', borderRadius: 4 }}>
      {m.label}
    </Tag>
  );
}

const containerStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.06)',
  background: '#fff',
  padding: '20px 24px',
  height: '100%',
};

const itemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 0',
  borderBottom: '1px solid #f5f5f5',
};

export default function RecentJobsList() {
  const { data: jobs, isLoading, isError } = useRecentJobs();

  return (
    <div style={containerStyle}>
      <Text strong style={{ fontSize: 14, color: '#595959', display: 'block', marginBottom: 16 }}>
        Attività Recente
      </Text>

      {isLoading && <LoadingSpinner size="small" tip="Caricamento attività..." />}
      {isError && <EmptyState description="Impossibile caricare le attività recenti" />}

      {!isLoading && !isError && (
        <>
          {!jobs?.length ? (
            <EmptyState description="Nessuna attività recente" />
          ) : (
            jobs.map((job) => (
              <div key={job.id} style={itemStyle}>
                <div style={{ flexShrink: 0 }}>{statusIcon(job.status)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {jobTypeLabel(job.job_type)}
                    {job.entity_ref && (
                      <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                        {job.entity_ref}
                      </Text>
                    )}
                  </div>
                </div>
                <div style={{ flexShrink: 0, fontSize: 12, color: '#bfbfbf' }}>
                  <RelativeTime date={job.started_at} />
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecentJobsList.tsx  --  Recent background jobs feed for the dashboard
// ---------------------------------------------------------------------------
import { Card, List, Badge, Tag, Typography } from 'antd';
import { useRecentJobs } from '@/hooks/queries/useDashboardKPIs';
import RelativeTime from '@/components/common/RelativeTime';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { JobLog } from '@/types';

const { Text } = Typography;

/** Map job status to Ant Design Badge status colours. */
function statusBadge(status: string): 'success' | 'processing' | 'error' | 'warning' | 'default' {
  switch (status) {
    case 'completed':
    case 'success':
      return 'success';
    case 'running':
    case 'in_progress':
      return 'processing';
    case 'failed':
    case 'error':
      return 'error';
    case 'pending':
    case 'queued':
      return 'warning';
    default:
      return 'default';
  }
}

export default function RecentJobsList() {
  const { data: jobs, isLoading, isError } = useRecentJobs();

  return (
    <Card title="Recent Jobs" size="small">
      {isLoading && <LoadingSpinner size="small" tip="Loading jobs..." />}

      {isError && <EmptyState description="Failed to load recent jobs" />}

      {!isLoading && !isError && (
        <List<JobLog>
          dataSource={jobs ?? []}
          locale={{ emptyText: <EmptyState description="No recent jobs" /> }}
          renderItem={(job) => (
            <List.Item key={job.id}>
              <List.Item.Meta
                title={
                  <span>
                    <Tag>{job.job_type}</Tag>
                    <Badge status={statusBadge(job.status)} text={job.status} />
                  </span>
                }
                description={
                  <span>
                    {job.entity_ref && (
                      <Text type="secondary" style={{ marginRight: 8 }}>
                        {job.entity_ref}
                      </Text>
                    )}
                    <RelativeTime date={job.started_at} />
                  </span>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

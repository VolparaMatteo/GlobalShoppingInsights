// ---------------------------------------------------------------------------
// AlertsList.tsx  --  Dashboard alerts / warnings feed
// ---------------------------------------------------------------------------
import { Card, List, Typography } from 'antd';
import {
  InfoCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useDashboardAlerts } from '@/hooks/queries/useDashboardKPIs';
import RelativeTime from '@/components/common/RelativeTime';
import EmptyState from '@/components/common/EmptyState';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import type { DashboardAlert } from '@/services/api/dashboard.api';

const { Text } = Typography;

/** Return an icon coloured by alert severity level. */
function alertIcon(level: DashboardAlert['level']): React.ReactNode {
  switch (level) {
    case 'error':
      return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 18 }} />;
    case 'warning':
      return <WarningOutlined style={{ color: '#faad14', fontSize: 18 }} />;
    case 'info':
    default:
      return <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 18 }} />;
  }
}

export default function AlertsList() {
  const { data: alerts, isLoading, isError } = useDashboardAlerts();

  return (
    <Card title="Alerts" size="small">
      {isLoading && <LoadingSpinner size="small" tip="Loading alerts..." />}

      {isError && <EmptyState description="Failed to load alerts" />}

      {!isLoading && !isError && (
        <List<DashboardAlert>
          dataSource={alerts ?? []}
          locale={{ emptyText: <EmptyState description="No active alerts" /> }}
          renderItem={(alert) => (
            <List.Item key={alert.id}>
              <List.Item.Meta
                avatar={alertIcon(alert.level)}
                title={<Text>{alert.message}</Text>}
                description={<RelativeTime date={alert.timestamp} />}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}

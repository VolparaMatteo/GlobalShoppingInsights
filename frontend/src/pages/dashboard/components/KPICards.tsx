// ---------------------------------------------------------------------------
// KPICards.tsx  --  Grid of Statistic cards for the dashboard overview
// ---------------------------------------------------------------------------
import { Row, Col, Card, Statistic, Alert } from 'antd';
import {
  FileTextOutlined,
  PlusCircleOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { DashboardKPIs } from '@/services/api/dashboard.api';

interface KPICardsProps {
  kpis: DashboardKPIs | null;
  isError: boolean;
}

interface KPIDefinition {
  title: string;
  key: string;
  icon: React.ReactNode;
  color: string;
  getValue: (kpis: DashboardKPIs) => number | string;
  suffix?: string;
}

const kpiDefinitions: KPIDefinition[] = [
  {
    title: 'Total Articles',
    key: 'total',
    icon: <FileTextOutlined />,
    color: '#1677ff',
    getValue: (k) => k.total_articles,
  },
  {
    title: 'New This Week',
    key: 'new_week',
    icon: <PlusCircleOutlined />,
    color: '#52c41a',
    getValue: (k) => k.new_this_week,
  },
  {
    title: 'In Review',
    key: 'in_review',
    icon: <EyeOutlined />,
    color: '#faad14',
    getValue: (k) => k.by_status['in_review'] ?? 0,
  },
  {
    title: 'Scheduled',
    key: 'scheduled',
    icon: <ClockCircleOutlined />,
    color: '#722ed1',
    getValue: (k) => k.by_status['scheduled'] ?? 0,
  },
  {
    title: 'Published',
    key: 'published',
    icon: <CheckCircleOutlined />,
    color: '#13c2c2',
    getValue: (k) => k.by_status['published'] ?? 0,
  },
  {
    title: 'Avg AI Score',
    key: 'ai_score',
    icon: <ThunderboltOutlined />,
    color: '#eb2f96',
    getValue: (k) => (k.avg_ai_score !== null ? k.avg_ai_score.toFixed(1) : '--'),
  },
];

export default function KPICards({ kpis, isError }: KPICardsProps) {
  if (isError) {
    return (
      <Alert
        message="Failed to load dashboard metrics"
        type="error"
        showIcon
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {kpiDefinitions.map((def) => (
        <Col xs={12} sm={8} lg={4} key={def.key}>
          <Card size="small" hoverable>
            <Statistic
              title={def.title}
              value={kpis ? def.getValue(kpis) : '--'}
              prefix={<span style={{ color: def.color }}>{def.icon}</span>}
              valueStyle={{ color: def.color }}
            />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

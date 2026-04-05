// ---------------------------------------------------------------------------
// KPICards.tsx  --  Modern KPI metric cards for the dashboard
// ---------------------------------------------------------------------------
import { Row, Col, Alert } from 'antd';
import {
  FileTextOutlined,
  RiseOutlined,
  EyeOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { DashboardKPIs } from '@/services/api/dashboard.api';
import type { CSSProperties } from 'react';

interface KPICardsProps {
  kpis: DashboardKPIs | null;
  isError: boolean;
}

interface KPIDefinition {
  title: string;
  key: string;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  getValue: (kpis: DashboardKPIs) => number | string;
  suffix?: string;
}

const kpiDefinitions: KPIDefinition[] = [
  {
    title: 'Articoli Totali',
    key: 'total',
    icon: <FileTextOutlined />,
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    iconBg: 'rgba(102, 126, 234, 0.12)',
    getValue: (k) => k.total_articles,
  },
  {
    title: 'Nuovi Settimana',
    key: 'new_week',
    icon: <RiseOutlined />,
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    iconBg: 'rgba(67, 233, 123, 0.12)',
    getValue: (k) => k.new_this_week,
  },
  {
    title: 'In Revisione',
    key: 'in_review',
    icon: <EyeOutlined />,
    gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    iconBg: 'rgba(246, 211, 101, 0.12)',
    getValue: (k) => k.by_status['in_review'] ?? 0,
  },
  {
    title: 'Pianificati',
    key: 'scheduled',
    icon: <CalendarOutlined />,
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    iconBg: 'rgba(161, 140, 209, 0.12)',
    getValue: (k) => k.by_status['scheduled'] ?? 0,
  },
  {
    title: 'Pubblicati',
    key: 'published',
    icon: <CheckCircleOutlined />,
    gradient: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
    iconBg: 'rgba(11, 163, 96, 0.12)',
    getValue: (k) => k.by_status['published'] ?? 0,
  },
  {
    title: 'Punteggio AI Medio',
    key: 'ai_score',
    icon: <ThunderboltOutlined />,
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    iconBg: 'rgba(250, 112, 154, 0.12)',
    getValue: (k) => k.avg_ai_score !== null ? k.avg_ai_score.toFixed(1) : '--',
  },
];

const cardStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.06)',
  background: '#fff',
  padding: '20px 18px',
  height: '100%',
  transition: 'box-shadow 0.2s ease, transform 0.2s ease',
  cursor: 'default',
};

const iconWrapStyle = (bg: string): CSSProperties => ({
  width: 44,
  height: 44,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  background: bg,
  marginBottom: 14,
});

export default function KPICards({ kpis, isError }: KPICardsProps) {
  if (isError) {
    return (
      <Alert
        message="Impossibile caricare le metriche della dashboard"
        type="error"
        showIcon
        style={{ marginBottom: 16, borderRadius: 8 }}
      />
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {kpiDefinitions.map((def) => {
        const value = kpis ? def.getValue(kpis) : '--';
        return (
          <Col xs={12} sm={8} lg={4} key={def.key}>
            <div
              style={cardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={iconWrapStyle(def.iconBg)}>
                <span style={{ background: def.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  {def.icon}
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1, color: '#141414' }}>
                {value}
              </div>
              <div style={{ fontSize: 13, color: '#8c8c8c', marginTop: 4 }}>
                {def.title}
              </div>
            </div>
          </Col>
        );
      })}
    </Row>
  );
}

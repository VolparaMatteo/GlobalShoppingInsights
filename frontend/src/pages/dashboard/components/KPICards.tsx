// ---------------------------------------------------------------------------
// KPICards.tsx — Modern KPI metric cards with sparkline trend (Sprint 7 b2)
// ---------------------------------------------------------------------------
import type { CSSProperties } from 'react';

import { Alert, Col, Row, theme as antdTheme } from 'antd';
import {
  CalendarCheck,
  CheckCircle2,
  Eye,
  FileText,
  TrendingUp,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import Sparkline from '@/components/common/Sparkline';
import type { DashboardKPIs } from '@/services/api/dashboard.api';

interface KPICardsProps {
  kpis: DashboardKPIs | null;
  isError: boolean;
}

interface KPIDefinition {
  title: string;
  key: string;
  icon: LucideIcon;
  accent: string; // CSS color variable
  iconBg: string;
  getValue: (kpis: DashboardKPIs) => number | string;
  suffix?: string;
}

const kpiDefinitions: KPIDefinition[] = [
  {
    title: 'Articoli Totali',
    key: 'total',
    icon: FileText,
    accent: 'var(--color-primary)',
    iconBg: 'var(--color-primary-bg)',
    getValue: (k) => k.total_articles,
  },
  {
    title: 'Nuovi Settimana',
    key: 'new_week',
    icon: TrendingUp,
    accent: 'var(--color-success)',
    iconBg: 'var(--color-success-bg)',
    getValue: (k) => k.new_this_week,
  },
  {
    title: 'In Revisione',
    key: 'in_review',
    icon: Eye,
    accent: 'var(--color-warning)',
    iconBg: 'var(--color-warning-bg)',
    getValue: (k) => k.by_status['in_review'] ?? 0,
  },
  {
    title: 'Pianificati',
    key: 'scheduled',
    icon: CalendarCheck,
    accent: 'var(--color-accent)',
    iconBg: 'var(--color-primary-bg)',
    getValue: (k) => k.by_status['scheduled'] ?? 0,
  },
  {
    title: 'Pubblicati',
    key: 'published',
    icon: CheckCircle2,
    accent: 'var(--color-success)',
    iconBg: 'var(--color-success-bg)',
    getValue: (k) => k.by_status['published'] ?? 0,
  },
  {
    title: 'Punteggio AI Medio',
    key: 'ai_score',
    icon: Zap,
    accent: 'var(--color-accent)',
    iconBg: 'var(--color-primary-bg)',
    getValue: (k) => (k.avg_ai_score !== null ? k.avg_ai_score.toFixed(1) : '--'),
  },
];

/**
 * Genera un trend mock semi-realistico basato sul valore corrente.
 * Sostituire con dati reali da backend quando /dashboard/kpis sara' esteso
 * (Sprint 6 post-VPS con Redis cache).
 */
function mockTrend(currentValue: number | string): Array<{ value: number }> {
  const end = typeof currentValue === 'number' ? currentValue : 0;
  if (end === 0) return [];
  // 7 punti con leggera crescita / oscillazione verso il valore finale.
  const points: number[] = [];
  for (let i = 0; i < 7; i++) {
    const progress = (i + 1) / 7;
    const base = end * progress;
    const noise = (Math.sin(i * 1.3) + Math.cos(i * 0.7)) * end * 0.06;
    points.push(Math.max(0, Math.round(base + noise)));
  }
  return points.map((value) => ({ value }));
}

export default function KPICards({ kpis, isError }: KPICardsProps) {
  const { token } = antdTheme.useToken();

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

  const cardStyle: CSSProperties = {
    borderRadius: 12,
    border: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorBgContainer,
    padding: '18px 16px 12px',
    height: '100%',
    transition: 'box-shadow var(--transition-base), transform var(--transition-base)',
    cursor: 'default',
    boxShadow: 'var(--shadow-sm)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  const iconWrapStyle = (bg: string, accent: string): CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: bg,
    color: accent,
    marginBottom: 10,
  });

  return (
    <Row gutter={[16, 16]}>
      {kpiDefinitions.map((def) => {
        const value = kpis ? def.getValue(kpis) : '--';
        const trend = kpis ? mockTrend(def.getValue(kpis)) : [];
        const Icon = def.icon;

        return (
          <Col xs={12} sm={8} lg={4} key={def.key}>
            <div
              style={cardStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={iconWrapStyle(def.iconBg, def.accent)}>
                <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 700,
                  lineHeight: 1.1,
                  color: token.colorText,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {value}
              </div>
              <div style={{ fontSize: 12, color: token.colorTextSecondary, marginBottom: 4 }}>
                {def.title}
              </div>
              <Sparkline data={trend} color={def.accent} height={32} />
            </div>
          </Col>
        );
      })}
    </Row>
  );
}

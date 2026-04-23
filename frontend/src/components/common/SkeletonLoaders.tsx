// ---------------------------------------------------------------------------
// components/common/SkeletonLoaders.tsx — Sprint 7 polish b2
//
// Skeleton loader riusabili con effetto shimmer. Antd Skeleton.Node supporta
// `active` per il pulse, ma aggiungiamo un gradient shimmer più moderno via
// CSS keyframes su componenti dove vogliamo impatto visivo maggiore.
//
// Esportati:
//   - SkeletonPage: header + card grid + table (dashboard / list pages)
//   - SkeletonTable: table rows placeholder
//   - SkeletonCards: card grid (3-6 card)
//   - SkeletonDetail: article/prompt detail layout (2 columns)
// ---------------------------------------------------------------------------
import type { CSSProperties, ReactNode } from 'react';

import { Card, Col, Row, Skeleton, theme as antdTheme } from 'antd';

function Shimmer({ style }: { style?: CSSProperties }) {
  // Custom shimmer component — gradient animato. antd Skeleton.active e'
  // un pulse, questo e' un "wave" piu' moderno che scorre L→R.
  return <div className="gsi-shimmer" style={style} aria-hidden="true" />;
}

interface SkeletonPageProps {
  /** Quante card nella riga KPI (default 4). */
  kpiCount?: number;
  /** Quante righe nella tabella (default 6). */
  tableRows?: number;
}

export function SkeletonPage({ kpiCount = 4, tableRows = 6 }: SkeletonPageProps) {
  const { token } = antdTheme.useToken();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Shimmer style={{ height: 28, width: '40%', maxWidth: 360, marginBottom: 10 }} />
        <Shimmer style={{ height: 16, width: '60%', maxWidth: 520 }} />
      </div>

      {/* KPI grid */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {Array.from({ length: kpiCount }).map((_, i) => (
          <Col xs={12} sm={8} lg={24 / kpiCount} key={i}>
            <Card
              size="small"
              style={{ borderColor: token.colorBorderSecondary }}
              styles={{ body: { padding: 16 } }}
            >
              <Shimmer style={{ height: 12, width: '70%', marginBottom: 12 }} />
              <Shimmer style={{ height: 30, width: '50%' }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Table */}
      <SkeletonTable rows={tableRows} />
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

export function SkeletonTable({ rows = 6, columns = 5 }: SkeletonTableProps) {
  return (
    <Card
      styles={{ body: { padding: 0 } }}
      style={{ borderRadius: 'var(--border-radius-lg)', overflow: 'hidden' }}
    >
      <div
        style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-border-secondary)' }}
      >
        <Row gutter={16}>
          {Array.from({ length: columns }).map((_, i) => (
            <Col key={i} flex={1}>
              <Shimmer style={{ height: 12 }} />
            </Col>
          ))}
        </Row>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          style={{
            padding: '14px 16px',
            borderBottom: r < rows - 1 ? '1px solid var(--color-border-secondary)' : 'none',
          }}
        >
          <Row gutter={16} align="middle">
            {Array.from({ length: columns }).map((_, c) => (
              <Col key={c} flex={1}>
                <Shimmer
                  style={{ height: 14, width: c === 0 ? '90%' : `${50 + ((c + r) % 4) * 10}%` }}
                />
              </Col>
            ))}
          </Row>
        </div>
      ))}
    </Card>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <Row gutter={[16, 16]}>
      {Array.from({ length: count }).map((_, i) => (
        <Col xs={24} md={24 / Math.min(count, 3)} key={i}>
          <Card styles={{ body: { padding: 16 } }}>
            <Skeleton.Avatar active size="small" style={{ marginBottom: 10 }} />
            <Shimmer style={{ height: 20, width: '80%', marginBottom: 8 }} />
            <Shimmer style={{ height: 14, width: '100%', marginBottom: 6 }} />
            <Shimmer style={{ height: 14, width: '60%' }} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}

export function SkeletonDetail({ children }: { children?: ReactNode }) {
  return (
    <Row gutter={[24, 24]}>
      <Col xs={24} lg={16}>
        <Card styles={{ body: { padding: 20 } }}>
          <Shimmer style={{ height: 32, width: '85%', marginBottom: 16 }} />
          <Shimmer style={{ height: 14, width: '100%', marginBottom: 8 }} />
          <Shimmer style={{ height: 14, width: '95%', marginBottom: 8 }} />
          <Shimmer style={{ height: 14, width: '70%', marginBottom: 20 }} />
          <Shimmer style={{ height: 200, marginBottom: 16, borderRadius: 8 }} />
          <Shimmer style={{ height: 14, width: '100%', marginBottom: 8 }} />
          <Shimmer style={{ height: 14, width: '90%', marginBottom: 8 }} />
          <Shimmer style={{ height: 14, width: '80%' }} />
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card styles={{ body: { padding: 20 } }}>
          <Shimmer style={{ height: 18, width: '50%', marginBottom: 12 }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <Shimmer
              key={i}
              style={{ height: 12, width: `${70 + (i % 3) * 10}%`, marginBottom: 10 }}
            />
          ))}
        </Card>
        {children}
      </Col>
    </Row>
  );
}

// ---------------------------------------------------------------------------
// components/common/PipelineFunnel.tsx — Sprint 7 polish
//
// Visualizzazione a funnel della pipeline editoriale. Mostra quanti articoli
// sono in ognuno dei 7 stati workflow (imported → screened → in_review →
// approved → scheduled → publishing → published), con i colori dai tokens e
// conversion rate tra step consecutivi.
//
// Recharts BarChart orizzontale (più leggibile di FunnelChart per 7 step).
// ---------------------------------------------------------------------------
import type { CSSProperties } from 'react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface PipelineFunnelProps {
  byStatus: Record<string, number>;
  /** Altezza del chart (default 260). */
  height?: number;
}

const FUNNEL_STAGES: Array<{ key: string; label: string; color: string }> = [
  { key: 'imported', label: 'Importati', color: 'var(--status-imported)' },
  { key: 'screened', label: 'Vagliati', color: 'var(--status-screened)' },
  { key: 'in_review', label: 'In revisione', color: 'var(--status-in-review)' },
  { key: 'approved', label: 'Approvati', color: 'var(--status-approved)' },
  { key: 'scheduled', label: 'Pianificati', color: 'var(--status-scheduled)' },
  { key: 'publishing', label: 'In pubblicazione', color: 'var(--status-publishing)' },
  { key: 'published', label: 'Pubblicati', color: 'var(--status-published)' },
];

export default function PipelineFunnel({ byStatus, height = 260 }: PipelineFunnelProps) {
  const data = FUNNEL_STAGES.map((stage) => ({
    label: stage.label,
    count: byStatus[stage.key] ?? 0,
    color: stage.color,
  }));

  const max = Math.max(1, ...data.map((d) => d.count));

  const tooltipStyle: CSSProperties = {
    background: 'var(--color-bg-elevated)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--border-radius-md)',
    padding: '8px 12px',
    fontSize: 13,
    color: 'var(--color-text-primary)',
    boxShadow: 'var(--shadow-md)',
  };

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <XAxis
            type="number"
            domain={[0, max * 1.1]}
            tick={{ fill: 'var(--color-text-tertiary)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--color-border-secondary)' }}
            tickLine={false}
          />
          <YAxis
            dataKey="label"
            type="category"
            width={120}
            tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            cursor={{ fill: 'var(--color-bg-layout)', opacity: 0.4 }}
            formatter={(value) => [`${value ?? 0} articoli`, '']}
          />
          <Bar
            dataKey="count"
            radius={[0, 6, 6, 0]}
            isAnimationActive={true}
            animationDuration={600}
          >
            {data.map((d, idx) => (
              <Cell key={idx} fill={d.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

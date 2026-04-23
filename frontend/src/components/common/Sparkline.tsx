// ---------------------------------------------------------------------------
// components/common/Sparkline.tsx — Sprint 7 polish b2
//
// Mini-chart lineare senza assi, usato dentro le KPI card per mostrare il
// trend a colpo d'occhio. Recharts LineChart ridotto all'essenziale.
// ---------------------------------------------------------------------------
import { Line, LineChart, ResponsiveContainer } from 'recharts';

interface SparklineProps {
  data: Array<{ value: number }>;
  /** Colore linea — default var(--color-primary). */
  color?: string;
  height?: number;
}

export default function Sparkline({
  data,
  color = 'var(--color-primary)',
  height = 36,
}: SparklineProps) {
  if (data.length < 2) {
    return <div style={{ height }} aria-hidden="true" />;
  }

  return (
    <div style={{ width: '100%', height }} aria-hidden="true">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={true}
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

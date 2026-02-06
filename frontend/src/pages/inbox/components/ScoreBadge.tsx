// ---------------------------------------------------------------------------
// ScoreBadge  --  Colour-coded badge showing an AI relevance score
// ---------------------------------------------------------------------------
import { Tag } from 'antd';

interface ScoreBadgeProps {
  score: number | null;
}

function getColor(score: number): string {
  if (score <= 30) return 'red';
  if (score <= 60) return 'orange';
  if (score <= 80) return 'blue';
  return 'green';
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return <Tag>N/A</Tag>;
  }

  return <Tag color={getColor(score)}>{score}</Tag>;
}

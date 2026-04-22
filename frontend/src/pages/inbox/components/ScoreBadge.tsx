// ---------------------------------------------------------------------------
// DEPRECATED wrapper — usa @/components/common/ScoreBadge direttamente.
// Backward-compat in attesa del rename degli import esistenti (Sprint 7
// refactoring batch).
// Il componente nuovo accetta prop `variant` ('circle'|'pill') e `size`.
// Default = circle, size md. Legacy API `score: number|null` rispettata.
// ---------------------------------------------------------------------------
import CommonScoreBadge from '@/components/common/ScoreBadge';

interface ScoreBadgeProps {
  score: number | null;
}

export default function ScoreBadge({ score }: ScoreBadgeProps) {
  return <CommonScoreBadge score={score} variant="pill" size="md" />;
}

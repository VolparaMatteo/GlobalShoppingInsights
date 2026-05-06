// ---------------------------------------------------------------------------
// Formatter del tempo di lettura.
// Il valore numerico in minuti arriva già calcolato dal backend
// (vedi backend/app/utils/reading_time.py — 200 wpm IT).
// ---------------------------------------------------------------------------

/** Variante "X min lettura" — adatta a header e meta pill. */
export function formatReadingTime(min: number | null | undefined): string {
  if (min == null || min <= 0) return '—';
  return `${min} min lettura`;
}

/** Variante compatta "X min" — adatta a tabelle e badge stretti. */
export function formatReadingTimeShort(min: number | null | undefined): string {
  if (min == null || min <= 0) return '—';
  return `${min} min`;
}

/**
 * Stima minuti di lettura da un testo client-side.
 * Mirror della formula backend (200 wpm IT) — usata per feedback live durante
 * l'editing dell'estratto pubblicazione, dove il valore server-side aggiorna
 * solo dopo il salvataggio.
 */
export function estimateReadingTime(text: string | null | undefined, wpm = 200): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 0;
  return Math.max(1, Math.ceil(words / wpm));
}

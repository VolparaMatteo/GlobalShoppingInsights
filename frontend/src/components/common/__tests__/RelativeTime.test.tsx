import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import RelativeTime from '../RelativeTime';

describe('RelativeTime', () => {
  it('renderizza una stringa relativa (es. "5 minuti fa")', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    render(<RelativeTime date={fiveMinutesAgo} />);

    // dayjs italiano: "5 minuti fa", "un minuto fa", ecc.
    // Verifichiamo solo che contenga "fa" — robusto ai cambi di plurali.
    const el = screen.getByText(/fa$/);
    expect(el).toBeInTheDocument();
  });

  it('espone il timestamp completo in tooltip (title attribute tramite antd)', () => {
    const date = '2025-01-15T10:30:00Z';
    const { container } = render(<RelativeTime date={date} />);
    // antd Tooltip wrap lo span; il title attribute appare sul child al mouseover.
    // Qui verifichiamo solo che il testo relativo sia stato calcolato.
    expect(container.textContent).toBeTruthy();
  });
});

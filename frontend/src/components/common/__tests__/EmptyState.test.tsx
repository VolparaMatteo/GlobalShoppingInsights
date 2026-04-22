import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState', () => {
  it('mostra la descrizione fornita', () => {
    render(<EmptyState description="Nessun articolo" />);
    expect(screen.getByText('Nessun articolo')).toBeInTheDocument();
  });

  it('usa la descrizione di default se non fornita', () => {
    render(<EmptyState />);
    expect(screen.getByText('Nessun dato disponibile')).toBeInTheDocument();
  });

  it('renderizza i children come action', () => {
    render(
      <EmptyState>
        <button>Aggiungi</button>
      </EmptyState>,
    );
    expect(screen.getByRole('button', { name: 'Aggiungi' })).toBeInTheDocument();
  });
});

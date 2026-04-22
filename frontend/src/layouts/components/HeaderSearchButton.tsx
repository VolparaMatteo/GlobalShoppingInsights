// ---------------------------------------------------------------------------
// HeaderSearchButton.tsx — Sprint 7 polish b6
//
// Pulsante "Cerca…" nell'header che apre la command palette (⌘K / Ctrl+K).
// Pattern Linear / Vercel / Raycast: sempre visibile nell'header, non un
// toggle icona soltanto.
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react';

import { theme as antdTheme } from 'antd';
import { Search } from 'lucide-react';

import CommandPalette from '@/components/common/CommandPalette';
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';

export default function HeaderSearchButton() {
  const [cmdOpen, setCmdOpen] = useState(false);
  const { token } = antdTheme.useToken();
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect OS Mac/non-Mac per mostrare ⌘K vs Ctrl K
    setIsMac(/Mac|iPhone|iPod|iPad/.test(navigator.platform));
  }, []);

  useKeyboardShortcut('mod+k', () => setCmdOpen((v) => !v), { allowInInput: true });

  return (
    <>
      <button
        type="button"
        onClick={() => setCmdOpen(true)}
        aria-label="Cerca articoli, prompt, utenti"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '7px 12px 7px 14px',
          minWidth: 240,
          maxWidth: 360,
          background: token.colorBgLayout,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: 10,
          cursor: 'pointer',
          transition: 'background 150ms, border-color 150ms',
          color: token.colorTextTertiary,
          fontSize: 13,
          fontFamily: 'inherit',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = token.colorBorder;
          e.currentTarget.style.background = token.colorBgContainer;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = token.colorBorderSecondary;
          e.currentTarget.style.background = token.colorBgLayout;
        }}
      >
        <Search size={15} strokeWidth={2.2} aria-hidden="true" />
        <span style={{ flex: 1, textAlign: 'left' }}>Cerca articoli, prompt, utenti…</span>
        <span
          style={{
            display: 'inline-flex',
            gap: 2,
            padding: '2px 6px',
            borderRadius: 4,
            border: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
            fontSize: 10,
            fontFamily: 'var(--font-family-mono)',
            fontWeight: 500,
            color: token.colorTextSecondary,
          }}
          aria-hidden="true"
        >
          {isMac ? '⌘' : 'Ctrl'}
          <span>K</span>
        </span>
      </button>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  );
}

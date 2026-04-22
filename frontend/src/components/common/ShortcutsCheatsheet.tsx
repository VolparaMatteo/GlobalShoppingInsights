// ---------------------------------------------------------------------------
// components/common/ShortcutsCheatsheet.tsx — Sprint 7 productivity
//
// Modal che mostra tutti i keyboard shortcut disponibili. Aperto con ?.
// ---------------------------------------------------------------------------
import { Modal, theme as antdTheme } from 'antd';

interface ShortcutsCheatsheetProps {
  open: boolean;
  onClose: () => void;
}

interface Shortcut {
  keys: string[]; // es. ['⌘', 'K']
  description: string;
}

interface Section {
  title: string;
  items: Shortcut[];
}

const SECTIONS: Section[] = [
  {
    title: 'Globali',
    items: [
      { keys: ['⌘', 'K'], description: 'Apri command palette (cerca articoli, prompt, utenti)' },
      { keys: ['Ctrl', 'K'], description: 'Apri command palette (Windows/Linux)' },
      { keys: ['?'], description: 'Mostra queste scorciatoie' },
      { keys: ['Esc'], description: 'Chiudi modali e drawer' },
    ],
  },
  {
    title: 'Navigazione',
    items: [
      { keys: ['G', 'D'], description: 'Vai alla Dashboard' },
      { keys: ['G', 'I'], description: 'Vai alla Posta in Arrivo' },
      { keys: ['G', 'P'], description: 'Vai ai Prompt' },
      { keys: ['G', 'C'], description: 'Vai al Calendario' },
    ],
  },
  {
    title: 'Tema',
    items: [{ keys: ['⌘', 'Shift', 'L'], description: 'Cambia tema chiaro / scuro' }],
  },
];

export default function ShortcutsCheatsheet({ open, onClose }: ShortcutsCheatsheetProps) {
  const { token } = antdTheme.useToken();

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="Scorciatoie da tastiera"
      width={520}
      styles={{
        body: { padding: 24 },
      }}
    >
      {SECTIONS.map((section) => (
        <div key={section.title} style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              color: token.colorTextTertiary,
              marginBottom: 8,
            }}
          >
            {section.title}
          </div>
          {section.items.map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom:
                  i < section.items.length - 1 ? `1px solid ${token.colorBorderSecondary}` : 'none',
              }}
            >
              <span style={{ fontSize: 13, color: token.colorText }}>{item.description}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {item.keys.map((k, idx) => (
                  <kbd
                    key={idx}
                    style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: 11,
                      padding: '2px 7px',
                      border: `1px solid ${token.colorBorder}`,
                      borderRadius: 4,
                      background: token.colorBgLayout,
                      color: token.colorText,
                      boxShadow: `0 1px 0 ${token.colorBorder}`,
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// hooks/useKeyboardShortcut.ts — Sprint 7 productivity
//
// Registra uno shortcut globale su window. Skip automatico se il focus e'
// dentro un input / textarea / contentEditable (eccetto per ⌘+K di apertura
// palette, gestito via opt-in `allowInInput`).
//
// Esempio:
//   useKeyboardShortcut('mod+k', () => setOpen(true));           // ⌘+K / Ctrl+K
//   useKeyboardShortcut('?', () => setShowCheatsheet(true));
//   useKeyboardShortcut('j', handleNext, { scope: 'inbox' });
// ---------------------------------------------------------------------------
import { useEffect } from 'react';

interface Options {
  /** Se true, lo shortcut funziona anche quando un input ha focus. */
  allowInInput?: boolean;
  /** Se false, disabilita registrazione (es. condizionale). */
  enabled?: boolean;
}

/**
 * Parse di una stringa "mod+k" / "shift+?" in parti.
 * "mod" = Cmd su Mac / Ctrl su altri.
 */
function parseCombo(combo: string) {
  const parts = combo
    .toLowerCase()
    .split('+')
    .map((p) => p.trim());
  return {
    needsMod: parts.includes('mod') || parts.includes('ctrl') || parts.includes('cmd'),
    needsShift: parts.includes('shift'),
    needsAlt: parts.includes('alt'),
    key: parts[parts.length - 1],
  };
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return (el as HTMLElement).isContentEditable === true;
}

export function useKeyboardShortcut(
  combo: string,
  handler: (e: KeyboardEvent) => void,
  options: Options = {},
) {
  const { allowInInput = false, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;
    const parsed = parseCombo(combo);

    function onKeyDown(e: KeyboardEvent) {
      // Skip se il focus e' in un input (salvo opt-in)
      if (!allowInInput && isInputFocused()) {
        // Eccezione: mod+k deve sempre aprire la palette anche da un input.
        if (!(parsed.needsMod && parsed.key === 'k')) return;
      }

      const modOk = parsed.needsMod ? e.metaKey || e.ctrlKey : !e.metaKey && !e.ctrlKey;
      const shiftOk = parsed.needsShift ? e.shiftKey : true;
      const altOk = parsed.needsAlt ? e.altKey : true;

      if (!modOk || !shiftOk || !altOk) return;

      // Match su key (case-insensitive)
      if (e.key.toLowerCase() === parsed.key) {
        e.preventDefault();
        handler(e);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [combo, handler, allowInInput, enabled]);
}

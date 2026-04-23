// ---------------------------------------------------------------------------
// components/common/CommandPalette.tsx — Sprint 7 productivity
//
// Command palette globale ⌘+K / Ctrl+K.
// Cerca tra: articoli, prompt, utenti. Offre azioni rapide (navigazione,
// toggle tema, nuovo prompt/utente se ruolo permette).
//
// Libreria: `cmdk` (Vercel) — lightweight, a11y nativa, fuzzy match built-in.
// Shell: Ant Design Modal per framing + il body renderizza <Command> di cmdk.
// ---------------------------------------------------------------------------
import { useEffect, useMemo, useState } from 'react';

import { Modal, theme as antdTheme } from 'antd';
import { Command } from 'cmdk';
import {
  CalendarDays,
  FileText,
  Inbox,
  LayoutDashboard,
  Moon,
  Search,
  Settings,
  Sun,
  Tags,
  Users,
  Bell,
  Plus,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useArticles } from '@/hooks/queries/useArticles';
import { usePrompts } from '@/hooks/queries/usePrompts';
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useDebounce } from '@/hooks/useDebounce';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface ActionItem {
  id: string;
  label: string;
  keywords?: string[];
  icon: LucideIcon;
  run: () => void;
  group: string;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { token } = antdTheme.useToken();
  const themeMode = useUiStore((s) => s.themeMode);
  const toggleTheme = useUiStore((s) => s.toggleThemeMode);
  const userRole = useAuthStore((s) => s.user?.role);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 200);

  // Reset query on close
  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  // Search articoli/prompt — abilitato solo se query non banale
  const searchEnabled = debouncedQuery.length >= 2;
  const articlesQ = useArticles(
    searchEnabled ? { search: debouncedQuery, page: 1, page_size: 5 } : {},
    { enabled: searchEnabled },
  );
  const promptsQ = usePrompts(
    searchEnabled ? { search: debouncedQuery, page: 1, page_size: 5 } : {},
  );

  const actions: ActionItem[] = useMemo(() => {
    const nav: ActionItem[] = [
      {
        id: 'goto-dashboard',
        label: 'Vai alla Dashboard',
        keywords: ['home', 'kpi', 'panoramica'],
        icon: LayoutDashboard,
        run: () => navigate('/dashboard'),
        group: 'Naviga',
      },
      {
        id: 'goto-inbox',
        label: 'Vai alla Posta in Arrivo',
        keywords: ['articoli', 'posta', 'screening'],
        icon: Inbox,
        run: () => navigate('/inbox'),
        group: 'Naviga',
      },
      {
        id: 'goto-prompts',
        label: 'Vai ai Prompt',
        keywords: ['ricerche', 'keyword'],
        icon: Search,
        run: () => navigate('/prompts'),
        group: 'Naviga',
      },
      {
        id: 'goto-calendar',
        label: 'Vai al Calendario',
        keywords: ['pianificazione', 'slot'],
        icon: CalendarDays,
        run: () => navigate('/calendar'),
        group: 'Naviga',
      },
      {
        id: 'goto-taxonomy',
        label: 'Vai alla Tassonomia',
        keywords: ['tag', 'categorie', 'wp'],
        icon: Tags,
        run: () => navigate('/taxonomy'),
        group: 'Naviga',
      },
      {
        id: 'goto-alerts',
        label: 'Vai agli Alert & Job Log',
        keywords: ['errori', 'job', 'log'],
        icon: Bell,
        run: () => navigate('/dashboard/alerts'),
        group: 'Naviga',
      },
    ];

    if (userRole === 'admin') {
      nav.push({
        id: 'goto-settings',
        label: 'Vai alle Impostazioni',
        keywords: ['admin', 'config', 'wordpress'],
        icon: Settings,
        run: () => navigate('/settings'),
        group: 'Naviga',
      });
    }

    const quick: ActionItem[] = [
      {
        id: 'toggle-theme',
        label: themeMode === 'dark' ? 'Passa a tema chiaro' : 'Passa a tema scuro',
        keywords: ['dark', 'light', 'colore', 'tema', 'notte', 'giorno'],
        icon: themeMode === 'dark' ? Sun : Moon,
        run: toggleTheme,
        group: 'Azioni rapide',
      },
    ];

    if (userRole && ['admin', 'editor', 'contributor'].includes(userRole)) {
      quick.push({
        id: 'new-prompt',
        label: 'Nuovo prompt di ricerca',
        keywords: ['crea', 'aggiungi', 'nuova'],
        icon: Plus,
        run: () => navigate('/prompts?new=1'),
        group: 'Azioni rapide',
      });
    }

    if (userRole === 'admin') {
      quick.push({
        id: 'new-user',
        label: 'Nuovo utente',
        keywords: ['crea', 'aggiungi', 'team'],
        icon: Users,
        run: () => navigate('/settings?section=users&new=1'),
        group: 'Azioni rapide',
      });
    }

    return [...nav, ...quick];
  }, [navigate, userRole, themeMode, toggleTheme]);

  function handleAction(run: () => void) {
    run();
    onClose();
  }

  const articleHits = articlesQ.data?.items ?? [];
  const promptHits = promptsQ.data?.items ?? [];

  // Group azioni per sezione
  const groupedActions = useMemo(() => {
    const groups = new Map<string, ActionItem[]>();
    for (const a of actions) {
      const arr = groups.get(a.group) ?? [];
      arr.push(a);
      groups.set(a.group, arr);
    }
    return Array.from(groups.entries());
  }, [actions]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={640}
      styles={{
        body: { padding: 0, background: token.colorBgElevated, borderRadius: 12 },
        content: { padding: 0, background: 'transparent', boxShadow: 'var(--shadow-xl)' },
      }}
      maskClosable
      destroyOnClose
      centered
    >
      <Command
        label="Command palette"
        shouldFilter={!searchEnabled /* se cerchiamo remoto, il filtering è già fatto */}
        className="gsi-cmdk"
        style={{ background: token.colorBgElevated, borderRadius: 12, overflow: 'hidden' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '14px 16px',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Search size={18} color={token.colorTextTertiary} aria-hidden="true" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Cerca articoli, prompt, utenti, o azioni…"
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 15,
              color: token.colorText,
              fontFamily: 'var(--font-family-base)',
            }}
            autoFocus
          />
          <kbd
            style={{
              fontSize: 11,
              padding: '2px 6px',
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 4,
              color: token.colorTextTertiary,
            }}
          >
            ESC
          </kbd>
        </div>

        <Command.List
          style={{
            maxHeight: 400,
            overflowY: 'auto',
            padding: 8,
          }}
        >
          <Command.Empty
            style={{
              padding: 24,
              textAlign: 'center',
              color: token.colorTextTertiary,
              fontSize: 13,
            }}
          >
            Nessun risultato per "{query}"
          </Command.Empty>

          {/* Actions + navigazione */}
          {groupedActions.map(([groupName, items]) => (
            <Command.Group
              key={groupName}
              heading={groupName}
              className="gsi-cmdk-group"
              style={{ padding: '4px 0' }}
            >
              {items.map((a) => {
                const Icon = a.icon;
                return (
                  <Command.Item
                    key={a.id}
                    value={`${a.label} ${a.keywords?.join(' ') ?? ''}`}
                    onSelect={() => handleAction(a.run)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      color: token.colorText,
                    }}
                  >
                    <Icon size={16} color={token.colorTextSecondary} aria-hidden="true" />
                    <span style={{ flex: 1 }}>{a.label}</span>
                  </Command.Item>
                );
              })}
            </Command.Group>
          ))}

          {/* Articoli */}
          {searchEnabled && articleHits.length > 0 && (
            <Command.Group heading="Articoli" style={{ padding: '4px 0' }}>
              {articleHits.map((art) => (
                <Command.Item
                  key={`art-${art.id}`}
                  value={`articolo ${art.title} ${art.source_domain ?? ''}`}
                  onSelect={() => handleAction(() => navigate(`/articles/${art.id}`))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: token.colorText,
                  }}
                >
                  <FileText size={16} color={token.colorTextSecondary} aria-hidden="true" />
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {art.title}
                  </span>
                  {art.source_domain && (
                    <span style={{ fontSize: 11, color: token.colorTextTertiary }}>
                      {art.source_domain}
                    </span>
                  )}
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Prompt */}
          {searchEnabled && promptHits.length > 0 && (
            <Command.Group heading="Prompt" style={{ padding: '4px 0' }}>
              {promptHits.map((p) => (
                <Command.Item
                  key={`pr-${p.id}`}
                  value={`prompt ${p.title}`}
                  onSelect={() => handleAction(() => navigate(`/prompts/${p.id}`))}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    color: token.colorText,
                  }}
                >
                  <Search size={16} color={token.colorTextSecondary} aria-hidden="true" />
                  <span style={{ flex: 1 }}>{p.title}</span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            fontSize: 11,
            color: token.colorTextTertiary,
            background: token.colorBgLayout,
          }}
        >
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> per navigare · <kbd>Enter</kbd> per selezionare
          </span>
          <span>
            <kbd>?</kbd> scorciatoie
          </span>
        </div>
      </Command>
    </Modal>
  );
}

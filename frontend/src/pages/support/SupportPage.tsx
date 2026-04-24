// ---------------------------------------------------------------------------
// SupportPage — Guida & Supporto.
// Shell con sidebar sezioni + contenuto centrale. Per ora solo /support/inbox
// è attivo, le altre sezioni sono placeholder "Coming soon".
// ---------------------------------------------------------------------------
import { Typography, theme as antdTheme } from 'antd';
import {
  Bell,
  BookOpen,
  CalendarDays,
  FileText,
  FolderTree,
  Inbox as InboxIcon,
  LifeBuoy,
  Search,
  Settings2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import InboxGuide from '@/pages/support/sections/InboxGuide';
import ComingSoonSection from '@/pages/support/sections/ComingSoonSection';

const { Title, Text } = Typography;

interface SectionEntry {
  slug: string;
  label: string;
  icon: LucideIcon;
  ready: boolean;
}

const SECTIONS: SectionEntry[] = [
  { slug: 'inbox', label: 'Inbox editoriale', icon: InboxIcon, ready: true },
  { slug: 'prompts', label: 'Prompt di ricerca', icon: Search, ready: false },
  { slug: 'article', label: 'Dettaglio articolo', icon: FileText, ready: false },
  { slug: 'calendar', label: 'Calendario', icon: CalendarDays, ready: false },
  { slug: 'taxonomy', label: 'Tassonomia', icon: FolderTree, ready: false },
  { slug: 'users', label: 'Utenti e ruoli', icon: Users, ready: false },
  { slug: 'alerts', label: 'Alert e log', icon: Bell, ready: false },
  { slug: 'settings', label: 'Impostazioni', icon: Settings2, ready: false },
];

export default function SupportPage() {
  const { token } = antdTheme.useToken();
  const location = useLocation();

  // Evidenzia la voce attiva dalla path corrente
  const activeSlug = location.pathname.split('/')[2] ?? 'inbox';

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, rgba(22,119,255,0.14) 0%, rgba(114,46,209,0.14) 100%)',
            border: `1px solid ${token.colorPrimary}33`,
            color: token.colorPrimary,
            flexShrink: 0,
          }}
        >
          <BookOpen size={22} strokeWidth={2} />
        </div>
        <div>
          <Title
            level={3}
            style={{ margin: 0, fontWeight: 700, letterSpacing: -0.3, color: token.colorText }}
          >
            Guida &amp; Supporto
          </Title>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Tutto quello che serve per usare GSI al meglio, pagina per pagina.
          </Text>
        </div>
      </div>

      {/* Layout: sidebar + contenuto */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* Sidebar sezioni */}
        <aside
          style={{
            width: 260,
            flexShrink: 0,
            background: token.colorBgContainer,
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
            padding: 14,
            alignSelf: 'stretch',
            boxShadow: 'var(--shadow-sm)',
            position: 'sticky',
            top: 24,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 8px 10px',
              fontSize: 10.5,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: token.colorTextTertiary,
            }}
          >
            <LifeBuoy size={13} />
            Sezioni
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {SECTIONS.map((sec) => (
              <SectionLink key={sec.slug} entry={sec} active={activeSlug === sec.slug} />
            ))}
          </nav>
        </aside>

        {/* Contenuto */}
        <main
          style={{
            flex: 1,
            minWidth: 0,
            background: token.colorBgContainer,
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
            padding: '24px 28px 32px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Routes>
            <Route path="inbox" element={<InboxGuide />} />
            {SECTIONS.filter((s) => !s.ready).map((sec) => (
              <Route
                key={sec.slug}
                path={sec.slug}
                element={<ComingSoonSection label={sec.label} />}
              />
            ))}
            {/* /support senza sub-path → redirect a inbox */}
            <Route path="*" element={<Navigate to="inbox" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SectionLink — voce clickable nella sidebar di support
// ---------------------------------------------------------------------------

interface SectionLinkProps {
  entry: SectionEntry;
  active: boolean;
}

function SectionLink({ entry, active }: SectionLinkProps) {
  const { token } = antdTheme.useToken();
  const Icon = entry.icon;

  return (
    <NavLink
      to={`/support/${entry.slug}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 12px',
        borderRadius: 8,
        textDecoration: 'none',
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        color: active ? token.colorPrimary : token.colorText,
        background: active
          ? 'linear-gradient(135deg, rgba(22,119,255,0.12) 0%, rgba(114,46,209,0.12) 100%)'
          : 'transparent',
        transition: 'background 150ms',
      }}
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.background = token.colorBgLayout;
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.background = 'transparent';
      }}
    >
      <Icon size={15} strokeWidth={2} />
      <span style={{ flex: 1, minWidth: 0 }}>{entry.label}</span>
      {!entry.ready && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            padding: '1px 6px',
            borderRadius: 4,
            background: token.colorFillQuaternary,
            color: token.colorTextTertiary,
            letterSpacing: 0.2,
          }}
        >
          presto
        </span>
      )}
    </NavLink>
  );
}

// ---------------------------------------------------------------------------
// AppHeader.tsx — Sprint 7 polish b6 (topbar allineata al design brand)
//
// Layout:
//   [ title + subtitle ]  [ search button ⌘K ]  [ locale · theme · bell | avatar ]
//
// Design consistent con sidebar + profile:
//   - Altezza 60px, sticky con backdrop blur
//   - Border bottom sottile dai tokens
//   - Search button prominente center (pattern Linear/Vercel)
//   - Avatar mini a destra cliccabile → /profile
// ---------------------------------------------------------------------------
import { useMemo } from 'react';

import { Layout, Space, theme as antdTheme, Typography } from 'antd';
import { useLocation } from 'react-router-dom';

import ThemeToggle from '@/components/common/ThemeToggle';
import HeaderAvatar from '@/layouts/components/HeaderAvatar';
import HeaderSearchButton from '@/layouts/components/HeaderSearchButton';
import NotificationBell from '@/layouts/components/NotificationBell';

const { Header } = Layout;

interface RouteMeta {
  title: string;
  subtitle?: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
  '/dashboard': {
    title: 'Dashboard',
    subtitle: 'Panoramica della tua pipeline editoriale',
  },
  '/dashboard/alerts': {
    title: 'Alert & Job Log',
    subtitle: 'Storico completo delle esecuzioni dello scheduler',
  },
  '/prompts': {
    title: 'Prompt',
    subtitle: 'Ricerche salvate e schedulazioni',
  },
  '/inbox': {
    title: 'Posta in Arrivo',
    subtitle: 'Articoli scoperti, filtrali e promuovili nel workflow',
  },
  '/calendar': {
    title: 'Calendario',
    subtitle: 'Pianificazione editoriale drag & drop',
  },
  '/taxonomy': {
    title: 'Tassonomia',
    subtitle: 'Tag e categorie sincronizzate con WordPress',
  },
  '/settings': {
    title: 'Impostazioni',
    subtitle: 'Configurazione WordPress, utenti e sistema',
  },
  '/profile': {
    title: 'Il mio profilo',
    subtitle: 'Avatar, dati personali e password',
  },
};

export default function AppHeader() {
  const location = useLocation();
  const { token } = antdTheme.useToken();

  const meta: RouteMeta = useMemo(() => {
    const path = location.pathname;
    if (ROUTE_META[path]) return ROUTE_META[path];

    const base = '/' + path.split('/').filter(Boolean)[0];
    if (ROUTE_META[base]) return ROUTE_META[base];

    if (path.startsWith('/articles/')) {
      return { title: 'Dettaglio articolo', subtitle: 'Contenuto, revisioni, tag e workflow' };
    }
    if (path.startsWith('/prompts/')) {
      return { title: 'Dettaglio prompt', subtitle: 'Parametri ricerca e cronologia esecuzioni' };
    }

    return { title: 'Global Shopping Insights' };
  }, [location.pathname]);

  return (
    <Header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        background: `${token.colorBgContainer}f2`, // 95% alpha per backdrop blur
        backdropFilter: 'saturate(180%) blur(10px)',
        WebkitBackdropFilter: 'saturate(180%) blur(10px)',
        padding: '0 24px',
        height: 60,
        lineHeight: 1,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* ---- Left: title + subtitle ---- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <Typography.Text
          strong
          style={{
            fontSize: 15,
            color: token.colorText,
            lineHeight: 1.2,
            letterSpacing: -0.2,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {meta.title}
        </Typography.Text>
        {meta.subtitle && (
          <Typography.Text
            type="secondary"
            style={{
              fontSize: 11.5,
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {meta.subtitle}
          </Typography.Text>
        )}
      </div>

      {/* ---- Center: search button (command palette trigger) ---- */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
        <HeaderSearchButton />
      </div>

      {/* ---- Right: controls ---- */}
      <Space size={6} align="center">
        <ThemeToggle />
        <NotificationBell />
        <span
          aria-hidden="true"
          style={{
            width: 1,
            height: 22,
            background: token.colorBorderSecondary,
            margin: '0 4px',
          }}
        />
        <HeaderAvatar />
      </Space>
    </Header>
  );
}

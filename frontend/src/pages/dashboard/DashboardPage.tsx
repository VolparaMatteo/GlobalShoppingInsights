// ---------------------------------------------------------------------------
// DashboardPage — Sprint 7 polish b16: welcome page temporanea.
// Gli analytics (KPI cards, funnel, recent jobs/alerts) verranno re-introdotti
// in un secondo momento, appena avremo dati di produzione sufficienti.
// I vecchi componenti sono in `pages/dashboard/components/` e non sono stati
// eliminati — possono tornare in uso senza ripescarli da git.
// ---------------------------------------------------------------------------
import { Typography, theme as antdTheme } from 'antd';
import dayjs from 'dayjs';
import {
  ArrowUpRight,
  Bell,
  CalendarDays,
  FolderTree,
  Inbox,
  Search,
  Settings2,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

// ---------------------------------------------------------------------------
// Quick action tiles
// ---------------------------------------------------------------------------

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
  /** Se true, mostra solo ad admin. */
  adminOnly?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: 'Prompt di ricerca',
    description: 'Crea, pianifica e monitora le ricerche automatiche.',
    icon: <Search size={20} strokeWidth={2} />,
    to: '/prompts',
  },
  {
    title: 'Inbox editoriale',
    description: 'Rivedi gli articoli importati, filtra e smista.',
    icon: <Inbox size={20} strokeWidth={2} />,
    to: '/inbox',
  },
  {
    title: 'Calendario',
    description: 'Pianifica gli articoli approvati per la pubblicazione.',
    icon: <CalendarDays size={20} strokeWidth={2} />,
    to: '/calendar',
  },
  {
    title: 'Tassonomia',
    description: 'Gestisci categorie e tag sincronizzati da WordPress.',
    icon: <FolderTree size={20} strokeWidth={2} />,
    to: '/taxonomy',
  },
  {
    title: 'Alert & log',
    description: 'Cronologia dei job dello scheduler (discovery, publish).',
    icon: <Bell size={20} strokeWidth={2} />,
    to: '/dashboard/alerts',
  },
  {
    title: 'Impostazioni',
    description: 'Configura WordPress, utenti, filtri della piattaforma.',
    icon: <Settings2 size={20} strokeWidth={2} />,
    to: '/settings',
    adminOnly: true,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const navigate = useNavigate();
  const { token } = antdTheme.useToken();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  const greeting = () => {
    const hour = dayjs().hour();
    if (hour < 12) return 'Buongiorno';
    if (hour < 18) return 'Buon pomeriggio';
    return 'Buonasera';
  };

  const actions = QUICK_ACTIONS.filter((a) => !a.adminOnly || isAdmin);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Hero */}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 16,
          padding: '40px 36px',
          marginBottom: 32,
          background:
            'linear-gradient(135deg, rgba(22,119,255,0.08) 0%, rgba(114,46,209,0.08) 100%)',
          border: `1px solid ${token.colorPrimary}1f`,
        }}
      >
        {/* Orb decorativi */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: -80,
            right: -60,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(22,119,255,0.18) 0%, rgba(22,119,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            bottom: -60,
            left: -40,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(114,46,209,0.18) 0%, rgba(114,46,209,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              marginBottom: 14,
              background: token.colorBgContainer,
              border: `1px solid ${token.colorPrimary}33`,
              fontSize: 12,
              fontWeight: 600,
              color: token.colorPrimary,
            }}
          >
            <Sparkles size={12} strokeWidth={2.4} />
            Benvenuto in GSI
          </div>

          <Title
            level={2}
            style={{
              margin: 0,
              fontWeight: 700,
              letterSpacing: -0.5,
              color: token.colorText,
              fontSize: 30,
              lineHeight: 1.25,
            }}
          >
            {greeting()}
            {user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </Title>

          <Text
            style={{
              display: 'block',
              marginTop: 10,
              fontSize: 15,
              color: token.colorTextSecondary,
              maxWidth: 620,
              lineHeight: 1.6,
            }}
          >
            Global Shopping Insights scopre articoli nel mondo del retail, li valuta con AI e ti
            aiuta a pubblicarli sulla tua piattaforma. Da dove vuoi iniziare?
          </Text>
        </div>
      </div>

      {/* Quick actions grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {actions.map((a) => (
          <QuickActionCard key={a.to} action={a} onClick={() => navigate(a.to)} />
        ))}
      </div>

      {/* Placeholder analytics */}
      <div
        style={{
          marginTop: 32,
          padding: '24px 28px',
          borderRadius: 12,
          border: `1px dashed ${token.colorBorderSecondary}`,
          background: token.colorBgLayout,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: token.colorBgContainer,
            border: `1px solid ${token.colorBorderSecondary}`,
            color: token.colorTextTertiary,
            flexShrink: 0,
          }}
        >
          <Sparkles size={18} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <Text strong style={{ fontSize: 13, color: token.colorText }}>
            Analytics in arrivo
          </Text>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Appena la pipeline produrrà dati sufficienti, qui troverai KPI, funnel della workflow
              e grafici sull'attività editoriale.
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuickActionCard — tile cliccabile con icon-square e freccia hover
// ---------------------------------------------------------------------------

interface QuickActionCardProps {
  action: QuickAction;
  onClick: () => void;
}

function QuickActionCard({ action, onClick }: QuickActionCardProps) {
  const { token } = antdTheme.useToken();

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: '20px 22px',
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        cursor: 'pointer',
        transition: 'all 180ms ease',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 150,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = token.colorPrimary;
        e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(22,119,255,0.18)';
        (e.currentTarget.querySelector('[data-arrow]') as HTMLElement | null)?.style.setProperty(
          'opacity',
          '1',
        );
        (e.currentTarget.querySelector('[data-arrow]') as HTMLElement | null)?.style.setProperty(
          'transform',
          'translate(0, 0)',
        );
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = token.colorBorderSecondary;
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget.querySelector('[data-arrow]') as HTMLElement | null)?.style.setProperty(
          'opacity',
          '0',
        );
        (e.currentTarget.querySelector('[data-arrow]') as HTMLElement | null)?.style.setProperty(
          'transform',
          'translate(-6px, 6px)',
        );
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'linear-gradient(135deg, rgba(22,119,255,0.14) 0%, rgba(114,46,209,0.14) 100%)',
            border: `1px solid ${token.colorPrimary}33`,
            color: token.colorPrimary,
          }}
        >
          {action.icon}
        </div>

        <span
          data-arrow
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 8,
            color: token.colorPrimary,
            background: `${token.colorPrimary}14`,
            opacity: 0,
            transform: 'translate(-6px, 6px)',
            transition: 'all 200ms ease',
          }}
        >
          <ArrowUpRight size={15} strokeWidth={2.4} />
        </span>
      </div>

      <div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: token.colorText,
            letterSpacing: -0.1,
            marginBottom: 4,
          }}
        >
          {action.title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: token.colorTextSecondary,
            lineHeight: 1.5,
          }}
        >
          {action.description}
        </div>
      </div>
    </button>
  );
}

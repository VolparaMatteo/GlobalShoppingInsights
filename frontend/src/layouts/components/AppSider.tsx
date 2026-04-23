// ---------------------------------------------------------------------------
// AppSider.tsx — Sprint 7 polish b5 (sidebar premium)
//
// Sidebar custom allineata alla login panel sinistra:
//   - Background dark immersivo #0b0d18 + mesh orb + grid overlay subtle
//   - Menu sezionato (Operativo / Editoriale / Sistema) con voci custom
//     (no AntD Menu) → pieno controllo su hover/active/badge.
//   - Active state: bar gradient brand sinistra (motion layoutId per slide
//     fluido tra voci) + bg tinted blue→purple al 18% alpha.
//   - Logo header con cerchio bianco shadow brand.
//   - User card footer con avatar gradient + nome + ruolo + dropdown.
//   - Collapse toggle custom (ChevronsLeft / ChevronsRight Lucide).
// ---------------------------------------------------------------------------
import { useEffect, useMemo } from 'react';

import { Layout } from 'antd';
import { motion } from 'framer-motion';
import {
  Bell,
  CalendarDays,
  ChevronsLeft,
  ChevronsRight,
  Inbox as InboxIcon,
  LayoutDashboard,
  Search,
  Settings,
  Tags,
  type LucideIcon,
} from 'lucide-react';

import SidebarNavItem from '@/layouts/components/SidebarNavItem';
import SidebarUserCard from '@/layouts/components/SidebarUserCard';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { useUiStore } from '@/stores/uiStore';

const { Sider } = Layout;

interface SidebarItem {
  to: string;
  icon: LucideIcon;
  label: string;
  end?: boolean;
  getBadge?: () => number | undefined;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
  adminOnly?: boolean;
}

interface AppSiderProps {
  collapsed: boolean;
}

export default function AppSider({ collapsed }: AppSiderProps) {
  const role = useAuthStore((s) => s.user?.role);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  const isAdmin = role === 'admin';

  // Persist collapsed state con CSS custom prop (fa da hint per eventuali
  // componenti che vogliono sapere lo stato senza subscribire allo store).
  useEffect(() => {
    document.documentElement.dataset.sidebarCollapsed = String(collapsed);
  }, [collapsed]);

  const sections: SidebarSection[] = useMemo(
    () => [
      {
        title: 'Operativo',
        items: [
          { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', end: true },
          { to: '/inbox', icon: InboxIcon, label: 'Posta in Arrivo' },
          { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
        ],
      },
      {
        title: 'Editoriale',
        items: [
          { to: '/prompts', icon: Search, label: 'Prompt' },
          { to: '/taxonomy', icon: Tags, label: 'Tassonomia' },
        ],
      },
      {
        title: 'Sistema',
        items: [
          {
            to: '/dashboard/alerts',
            icon: Bell,
            label: 'Alert & Job Log',
            getBadge: () => unreadCount || undefined,
          },
          ...(isAdmin
            ? [{ to: '/settings', icon: Settings, label: 'Impostazioni' } as SidebarItem]
            : []),
        ],
      },
    ],
    [isAdmin, unreadCount],
  );

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      trigger={null}
      width={248}
      collapsedWidth={76}
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        background: '#0b0d18',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Mesh gradient orb (subtle, per allineamento visual con login) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -150,
          left: -100,
          width: 320,
          height: 320,
          background:
            'radial-gradient(circle at 30% 30%, rgba(22,119,255,0.22) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -140,
          right: -80,
          width: 280,
          height: 280,
          background:
            'radial-gradient(circle at 70% 70%, rgba(114,46,209,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
          pointerEvents: 'none',
        }}
      />

      {/* ============ LAYOUT: header | nav | footer ============ */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          padding: '18px 0 14px',
        }}
      >
        {/* ---- Header: logo + brand ---- */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '0 18px 14px' : '0 18px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 3,
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(22,119,255,0.35)',
            }}
          >
            <img
              src="/logo-gsi.png"
              alt=""
              aria-hidden="true"
              width={30}
              height={30}
              style={{ display: 'block', objectFit: 'contain' }}
            />
          </div>
          {!collapsed && (
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: 1.2,
                lineHeight: 1,
                whiteSpace: 'nowrap',
                background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.72) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
              aria-label="Global Shopping Insights"
            >
              GSI
            </span>
          )}
        </div>

        {/* ---- Nav: sezioni ---- */}
        <nav
          aria-label="Navigazione principale"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            display: 'flex',
            flexDirection: 'column',
            gap: collapsed ? 14 : 18,
            paddingBottom: 12,
          }}
        >
          {sections.map((section, idx) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: 0.05 * idx, ease: [0.2, 0.8, 0.2, 1] }}
            >
              {!collapsed && (
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: 'rgba(255,255,255,0.38)',
                    padding: '0 22px',
                    marginBottom: 6,
                  }}
                >
                  {section.title}
                </div>
              )}
              {collapsed && idx > 0 && (
                <div
                  style={{
                    height: 1,
                    background: 'rgba(255,255,255,0.06)',
                    margin: '0 18px 6px',
                  }}
                  aria-hidden="true"
                />
              )}
              {section.items.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  to={item.to}
                  icon={item.icon}
                  label={item.label}
                  end={item.end}
                  collapsed={collapsed}
                  badge={item.getBadge?.()}
                />
              ))}
            </motion.div>
          ))}
        </nav>

        {/* ---- Footer: user card + collapse toggle ---- */}
        <div
          style={{
            padding: collapsed ? '10px 12px 0' : '10px 14px 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <SidebarUserCard collapsed={collapsed} />

          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Espandi sidebar' : 'Riduci sidebar'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-end',
              gap: 6,
              padding: '6px 8px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 6,
              transition: 'color 150ms, background 150ms',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.85)';
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {collapsed ? (
              <ChevronsRight size={16} aria-hidden="true" />
            ) : (
              <>
                <span>Riduci</span>
                <ChevronsLeft size={14} aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Scrollbar custom dark per la nav */}
      <style>{`
        nav::-webkit-scrollbar { width: 6px; }
        nav::-webkit-scrollbar-track { background: transparent; }
        nav::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        nav::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
        .gsi-sidebar-item:hover {
          background: rgba(255,255,255,0.06) !important;
        }
      `}</style>
    </Sider>
  );
}

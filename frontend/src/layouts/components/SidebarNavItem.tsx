// ---------------------------------------------------------------------------
// SidebarNavItem.tsx — Sprint 7 polish b5
//
// Voce di menu custom della sidebar. Sostituisce AntD Menu.Item per avere
// controllo pieno su:
//   - hover state (bg rgba subtle + transition)
//   - active state (gradient bar sinistra + bg tinted + text bianco puro)
//   - badge counter opzionale (es. unread notifications)
//   - collapsed mode (solo icona centrata, tooltip al hover)
// ---------------------------------------------------------------------------
import type { CSSProperties } from 'react';

import { Tooltip } from 'antd';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface SidebarNavItemProps {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed?: boolean;
  badge?: number;
  /** Match esatto vs prefix — es. /dashboard vs /dashboard/alerts. */
  end?: boolean;
}

export default function SidebarNavItem({
  to,
  icon: Icon,
  label,
  collapsed = false,
  badge,
  end = false,
}: SidebarNavItemProps) {
  const content = (isActive: boolean) => (
    <div style={itemStyle(isActive, collapsed)} className="gsi-sidebar-item">
      {/* Active indicator bar (left) */}
      {isActive && (
        <motion.span
          layoutId="gsi-sidebar-active-bar"
          transition={{ type: 'spring', stiffness: 420, damping: 36 }}
          style={{
            position: 'absolute',
            left: 0,
            top: 6,
            bottom: 6,
            width: 3,
            borderRadius: '0 3px 3px 0',
            background: 'linear-gradient(180deg, #1677ff 0%, #722ed1 100%)',
          }}
          aria-hidden="true"
        />
      )}

      <Icon
        size={18}
        strokeWidth={2.1}
        style={{
          flexShrink: 0,
          color: isActive ? '#ffffff' : 'rgba(255,255,255,0.62)',
          transition: 'color 150ms',
        }}
        aria-hidden="true"
      />

      {!collapsed && (
        <>
          <span
            style={{
              flex: 1,
              fontSize: 13.5,
              fontWeight: isActive ? 600 : 500,
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.78)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'color 150ms',
            }}
          >
            {label}
          </span>

          {badge !== undefined && badge > 0 && (
            <span
              style={{
                minWidth: 20,
                height: 20,
                padding: '0 6px',
                borderRadius: 10,
                fontSize: 11,
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive
                  ? 'rgba(255,255,255,0.22)'
                  : 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                color: '#ffffff',
                lineHeight: 1,
                boxShadow: isActive ? 'none' : '0 2px 4px rgba(22,119,255,0.35)',
              }}
            >
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </div>
  );

  const link = (
    <NavLink
      to={to}
      end={end}
      style={{ textDecoration: 'none', display: 'block' }}
      aria-label={collapsed ? label : undefined}
    >
      {({ isActive }) => content(isActive)}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip title={label} placement="right" mouseEnterDelay={0.15}>
        {link}
      </Tooltip>
    );
  }
  return link;
}

function itemStyle(isActive: boolean, collapsed: boolean): CSSProperties {
  return {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: collapsed ? '10px 0' : '9px 14px',
    justifyContent: collapsed ? 'center' : undefined,
    margin: collapsed ? '2px 12px' : '2px 10px',
    borderRadius: 8,
    background: isActive
      ? 'linear-gradient(135deg, rgba(22,119,255,0.18) 0%, rgba(114,46,209,0.18) 100%)'
      : 'transparent',
    cursor: 'pointer',
    transition: 'background 150ms, transform 150ms',
  };
}

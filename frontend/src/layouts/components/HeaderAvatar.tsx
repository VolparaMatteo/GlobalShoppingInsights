// ---------------------------------------------------------------------------
// HeaderAvatar.tsx — avatar mini nella topbar, link a /profile
// ---------------------------------------------------------------------------
import { Avatar, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useAuthStore } from '@/stores/authStore';

function initialsFromName(name?: string): string {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_GRADIENT = 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)';

export default function HeaderAvatar() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const displayName = user?.name ?? 'Utente';
  const avatarUrl = user?.avatar_url ?? null;
  const initials = initialsFromName(user?.name);

  return (
    <Tooltip title={`${displayName} — apri profilo`} placement="bottom">
      <button
        type="button"
        onClick={() => navigate('/profile')}
        aria-label="Apri il mio profilo"
        style={{
          background: 'transparent',
          border: 'none',
          padding: 2,
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'inline-flex',
          transition: 'transform 120ms',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
        }}
      >
        {avatarUrl ? (
          <Avatar src={avatarUrl} size={32} alt={displayName} />
        ) : (
          <Avatar
            size={32}
            style={{
              background: AVATAR_GRADIENT,
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 12.5,
            }}
          >
            {initials}
          </Avatar>
        )}
      </button>
    </Tooltip>
  );
}

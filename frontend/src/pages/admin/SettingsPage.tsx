// ---------------------------------------------------------------------------
// SettingsPage — Sprint 7 polish b13 (premium hero + card + Lucide tab icons)
// ---------------------------------------------------------------------------
import { useState } from 'react';

import { Tabs, Typography, theme as antdTheme } from 'antd';
import { Ban, Bot, FileClock, Fingerprint, Globe, Settings2, Users } from 'lucide-react';

import RoleGuard from '@/router/RoleGuard';
import AuditLogViewer from '@/pages/admin/components/AuditLogViewer';
import BlacklistSettings from '@/pages/admin/components/BlacklistSettings';
import DedupSettings from '@/pages/admin/components/DedupSettings';
import ScrapingSettings from '@/pages/admin/components/ScrapingSettings';
import UserManagement from '@/pages/admin/components/UserManagement';
import WordPressSettings from '@/pages/admin/components/WordPressSettings';

const { Title, Text } = Typography;

interface TabDef {
  key: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function SettingsPage() {
  const { token } = antdTheme.useToken();
  const [activeTab, setActiveTab] = useState('wordpress');

  const tabs: TabDef[] = [
    {
      key: 'wordpress',
      label: 'WordPress',
      icon: <Globe size={14} />,
      content: <WordPressSettings />,
    },
    {
      key: 'blacklist',
      label: 'Blacklist',
      icon: <Ban size={14} />,
      content: <BlacklistSettings />,
    },
    {
      key: 'scraping',
      label: 'Scraping',
      icon: <Bot size={14} />,
      content: <ScrapingSettings />,
    },
    {
      key: 'dedup',
      label: 'Dedup',
      icon: <Fingerprint size={14} />,
      content: <DedupSettings />,
    },
    {
      key: 'users',
      label: 'Utenti',
      icon: <Users size={14} />,
      content: <UserManagement />,
    },
    {
      key: 'audit',
      label: 'Registro audit',
      icon: <FileClock size={14} />,
      content: <AuditLogViewer />,
    },
  ];

  const items = tabs.map((t) => ({
    key: t.key,
    label: (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {t.icon}
        <span>{t.label}</span>
      </span>
    ),
    children: t.content,
  }));

  return (
    <RoleGuard allowedRoles={['admin']}>
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
            <Settings2 size={22} strokeWidth={2} />
          </div>
          <div>
            <Title
              level={3}
              style={{ margin: 0, fontWeight: 700, letterSpacing: -0.3, color: token.colorText }}
            >
              Impostazioni
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Configura WordPress, filtri, utenti e audit della piattaforma.
            </Text>
          </div>
        </div>

        {/* Main card */}
        <div
          style={{
            background: token.colorBgContainer,
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
            padding: '8px 20px 20px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={items}
            destroyInactiveTabPane
            size="middle"
          />
        </div>
      </div>
    </RoleGuard>
  );
}

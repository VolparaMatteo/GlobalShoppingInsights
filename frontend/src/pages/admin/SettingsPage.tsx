import React, { useState } from 'react';
import { Tabs } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import RoleGuard from '@/router/RoleGuard';
import WordPressSettings from '@/pages/admin/components/WordPressSettings';
import BlacklistSettings from '@/pages/admin/components/BlacklistSettings';
import ScrapingSettings from '@/pages/admin/components/ScrapingSettings';
import DedupSettings from '@/pages/admin/components/DedupSettings';
import UserManagement from '@/pages/admin/components/UserManagement';
import AuditLogViewer from '@/pages/admin/components/AuditLogViewer';

const TAB_ITEMS = [
  { key: 'wordpress', label: 'WordPress', children: <WordPressSettings /> },
  { key: 'blacklist', label: 'Blacklist', children: <BlacklistSettings /> },
  { key: 'scraping', label: 'Scraping', children: <ScrapingSettings /> },
  { key: 'dedup', label: 'Dedup', children: <DedupSettings /> },
  { key: 'users', label: 'Users', children: <UserManagement /> },
  { key: 'audit', label: 'Audit Log', children: <AuditLogViewer /> },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('wordpress');

  return (
    <RoleGuard allowedRoles={['admin']}>
      <div>
        <PageHeader title="Settings" subtitle="Manage application configuration" />
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={TAB_ITEMS}
          destroyInactiveTabPane
        />
      </div>
    </RoleGuard>
  );
}

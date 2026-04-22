// ---------------------------------------------------------------------------
// TaxonomyPage — Sprint 7 polish b14 (premium hero + card + Lucide tab icons)
// ---------------------------------------------------------------------------
import { useEffect, useRef, useState } from 'react';

import { Button, Tabs, Typography, theme as antdTheme } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { FolderOpen, FolderTree, RefreshCw, Tag as TagIcon } from 'lucide-react';

import { queryKeys } from '@/config/queryKeys';
import { useToast } from '@/hooks/useToast';
import CategoriesList from '@/pages/taxonomy/components/CategoriesList';
import TagsList from '@/pages/taxonomy/components/TagsList';
import { syncWP } from '@/services/api/taxonomy.api';

const { Title, Text } = Typography;

export default function TaxonomyPage() {
  const { token } = antdTheme.useToken();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('categories');
  const [syncing, setSyncing] = useState(false);
  const autoSynced = useRef(false);

  // Sync automatico al mount (una sola volta per mount della pagina)
  useEffect(() => {
    if (autoSynced.current) return;
    autoSynced.current = true;

    syncWP()
      .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.all }))
      .catch(() => toast.warning('Sincronizzazione con WordPress non riuscita'));
    // toast è stabile (useRef interno), queryClient è stabile dal provider
  }, [queryClient, toast]);

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      await syncWP();
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.all });
      toast.success('Tassonomia sincronizzata da WordPress');
    } catch (err) {
      toast.error(err);
    } finally {
      setSyncing(false);
    }
  };

  const items = [
    {
      key: 'categories',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FolderOpen size={14} />
          Categorie
        </span>
      ),
      children: <CategoriesList />,
    },
    {
      key: 'tags',
      label: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <TagIcon size={14} />
          Tag
        </span>
      ),
      children: <TagsList />,
    },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Hero */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
            <FolderTree size={22} strokeWidth={2} />
          </div>
          <div>
            <Title
              level={3}
              style={{ margin: 0, fontWeight: 700, letterSpacing: -0.3, color: token.colorText }}
            >
              Tassonomia
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              Categorie e tag sincronizzati da WordPress, organizzati per l'editor.
            </Text>
          </div>
        </div>

        <Button
          icon={<RefreshCw size={14} />}
          loading={syncing}
          onClick={handleManualSync}
          style={{ height: 40, borderRadius: 10, fontWeight: 500, padding: '0 16px' }}
        >
          Sincronizza WP
        </Button>
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
          destroyInactiveTabPane={false}
          size="middle"
        />
      </div>
    </div>
  );
}

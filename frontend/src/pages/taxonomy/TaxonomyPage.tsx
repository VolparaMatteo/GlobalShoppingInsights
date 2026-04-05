import React, { useState, useEffect, useRef } from 'react';
import { Tabs, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import TagsList from '@/pages/taxonomy/components/TagsList';
import CategoriesList from '@/pages/taxonomy/components/CategoriesList';
import { syncWP } from '@/services/api/taxonomy.api';
import { queryKeys } from '@/config/queryKeys';

const TAB_ITEMS = [
  { key: 'categories', label: 'Categorie', children: <CategoriesList /> },
  { key: 'tags', label: 'Tags', children: <TagsList /> },
];

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState('categories');
  const queryClient = useQueryClient();
  const synced = useRef(false);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;

    syncWP()
      .then(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.all });
      })
      .catch(() => {
        message.warning('Sincronizzazione con WordPress non riuscita');
      });
  }, [queryClient]);

  return (
    <div>
      <PageHeader title="Taxonomy" />
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={TAB_ITEMS}
        destroyInactiveTabPane={false}
      />
    </div>
  );
}

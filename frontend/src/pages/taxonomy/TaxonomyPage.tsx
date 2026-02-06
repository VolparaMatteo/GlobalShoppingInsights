import React, { useState } from 'react';
import { Tabs } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import TagsList from '@/pages/taxonomy/components/TagsList';
import CategoriesList from '@/pages/taxonomy/components/CategoriesList';
import WPSyncButton from '@/pages/taxonomy/components/WPSyncButton';

const TAB_ITEMS = [
  { key: 'tags', label: 'Tags', children: <TagsList /> },
  { key: 'categories', label: 'Categories', children: <CategoriesList /> },
];

export default function TaxonomyPage() {
  const [activeTab, setActiveTab] = useState('tags');

  return (
    <div>
      <PageHeader title="Taxonomy" extra={<WPSyncButton />} />
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={TAB_ITEMS}
        destroyInactiveTabPane={false}
      />
    </div>
  );
}

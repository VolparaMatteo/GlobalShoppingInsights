import React, { useState } from 'react';
import { Button, Dropdown, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

interface ExportButtonProps {
  endpoint: string;
  queryParams?: Record<string, string>;
  filenamePrefix?: string;
}

export default function ExportButton({ endpoint, queryParams = {}, filenamePrefix = 'export' }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...queryParams, format });
      const url = `${endpoint}?${params.toString()}`;
      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

      message.success(`Exported as ${format.toUpperCase()}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setLoading(false);
    }
  };

  const items: MenuProps['items'] = [
    { key: 'csv', label: 'Export as CSV', onClick: () => handleExport('csv') },
    { key: 'json', label: 'Export as JSON', onClick: () => handleExport('json') },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button icon={<DownloadOutlined />} loading={loading}>
        Export
      </Button>
    </Dropdown>
  );
}

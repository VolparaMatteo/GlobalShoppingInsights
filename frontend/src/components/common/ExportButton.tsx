import { useState } from 'react';
import { Button, Dropdown, message } from 'antd';
import type { MenuProps } from 'antd';
import { Download } from 'lucide-react';

interface ExportButtonProps {
  endpoint: string;
  queryParams?: Record<string, string>;
  filenamePrefix?: string;
}

export default function ExportButton({
  endpoint,
  queryParams = {},
  filenamePrefix = 'export',
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ ...queryParams, format });
      const url = `${endpoint}?${params.toString()}`;
      const response = await fetch(url, { credentials: 'include' });

      if (!response.ok) {
        throw new Error(`Esportazione fallita con stato ${response.status}`);
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

      message.success(`Esportato come ${format.toUpperCase()}`);
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Esportazione fallita');
    } finally {
      setLoading(false);
    }
  };

  const items: MenuProps['items'] = [
    { key: 'csv', label: 'Esporta come CSV', onClick: () => handleExport('csv') },
    { key: 'json', label: 'Esporta come JSON', onClick: () => handleExport('json') },
  ];

  return (
    <Dropdown menu={{ items }} trigger={['click']}>
      <Button
        icon={<Download size={14} />}
        loading={loading}
        style={{ height: 40, borderRadius: 10, fontWeight: 500, padding: '0 16px' }}
      >
        Esporta
      </Button>
    </Dropdown>
  );
}

import React from 'react';
import { Typography, Space } from 'antd';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, extra }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0 }}>{title}</Typography.Title>
        {subtitle && <Typography.Text type="secondary">{subtitle}</Typography.Text>}
      </div>
      {extra && <Space>{extra}</Space>}
    </div>
  );
}

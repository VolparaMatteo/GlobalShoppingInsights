import React from 'react';
import { Empty } from 'antd';

interface EmptyStateProps {
  description?: string;
  image?: React.ReactNode;
  children?: React.ReactNode;
}

export default function EmptyState({
  description = 'No data available',
  image,
  children,
}: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <Empty
        image={image || Empty.PRESENTED_IMAGE_SIMPLE}
        description={description}
      >
        {children}
      </Empty>
    </div>
  );
}

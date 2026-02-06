import React from 'react';
import { Spin } from 'antd';

interface LoadingSpinnerProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
}

export default function LoadingSpinner({ tip = 'Loading...', size = 'large' }: LoadingSpinnerProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <Spin tip={tip} size={size} />
    </div>
  );
}

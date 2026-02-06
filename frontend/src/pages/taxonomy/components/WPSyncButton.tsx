import React from 'react';
import { Button, notification } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/config/queryKeys';
import { syncWP } from '@/services/api/taxonomy.api';
import { showConfirmModal } from '@/components/common/ConfirmModal';

export default function WPSyncButton() {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: syncWP,
    onSuccess: (data) => {
      notification.success({
        message: 'WordPress Sync Complete',
        description: data.message || 'Tags and categories have been synced with WordPress.',
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.taxonomy.all });
    },
    onError: () => {
      notification.error({
        message: 'WordPress Sync Failed',
        description: 'An error occurred while syncing taxonomy with WordPress. Please try again.',
      });
    },
  });

  function handleClick() {
    showConfirmModal({
      title: 'Sync with WordPress',
      content:
        'This will synchronize all tags and categories with your WordPress site. Existing entries will be updated and new ones created. Continue?',
      okText: 'Sync Now',
      onOk: () => syncMutation.mutateAsync(),
    });
  }

  return (
    <Button
      icon={<SyncOutlined spin={syncMutation.isPending} />}
      onClick={handleClick}
      loading={syncMutation.isPending}
    >
      Sync with WordPress
    </Button>
  );
}

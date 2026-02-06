// ---------------------------------------------------------------------------
// RunSearchButton.tsx  --  Trigger a manual search execution for a prompt
// ---------------------------------------------------------------------------
import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, message, Modal } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

import { runPromptSearch } from '@/services/api/prompts.api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RunSearchButtonProps {
  promptId: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RunSearchButton({ promptId }: RunSearchButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => runPromptSearch(promptId),
    onSuccess: (searchRun) => {
      message.success(
        `Search started successfully (Run #${searchRun.id})`,
      );
      // Refresh search history data
      queryClient.invalidateQueries({ queryKey: ['searchRuns', promptId] });
    },
    onError: () => {
      message.error('Failed to start the search. Please try again.');
    },
  });

  const handleClick = useCallback(() => {
    Modal.confirm({
      title: 'Run Search',
      content:
        'This will execute the search prompt now and may take a few minutes. Do you want to proceed?',
      okText: 'Run Search',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: () => mutation.mutateAsync(),
    });
  }, [mutation]);

  return (
    <Button
      type="primary"
      icon={<PlayCircleOutlined />}
      onClick={handleClick}
      loading={mutation.isPending}
    >
      {mutation.isPending ? 'Running...' : 'Run Search'}
    </Button>
  );
}

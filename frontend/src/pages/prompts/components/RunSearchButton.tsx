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
      message.success(`Ricerca avviata con successo (Esecuzione #${searchRun.id})`);
      // Refresh search history data
      queryClient.invalidateQueries({ queryKey: ['searchRuns', promptId] });
    },
    onError: () => {
      message.error('Impossibile avviare la ricerca. Riprova.');
    },
  });

  const handleClick = useCallback(() => {
    Modal.confirm({
      title: 'Avvia Ricerca',
      content:
        'Verrà eseguita la ricerca del prompt adesso e potrebbe richiedere alcuni minuti. Vuoi procedere?',
      okText: 'Avvia Ricerca',
      okType: 'primary',
      cancelText: 'Annulla',
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
      {mutation.isPending ? 'In esecuzione...' : 'Avvia Ricerca'}
    </Button>
  );
}

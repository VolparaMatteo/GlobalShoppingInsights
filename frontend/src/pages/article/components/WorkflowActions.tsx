// ---------------------------------------------------------------------------
// WorkflowActions.tsx  --  Workflow transition action buttons
// ---------------------------------------------------------------------------
import React from 'react';
import { Button, Space, message } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  SendOutlined,
  RollbackOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Article } from '@/types';
import { changeStatus, getTransitions } from '@/services/api/articles.api';
import { queryKeys } from '@/config/queryKeys';
import { STATUS_MAP, type ArticleStatus } from '@/config/constants';
import { showConfirmModal } from '@/components/common/ConfirmModal';

interface WorkflowActionsProps {
  article: Article;
  onStatusChange?: (updated: Article) => void;
}

/** Map certain statuses to specific button styles for visual clarity. */
function getButtonProps(targetStatus: string): { type: 'primary' | 'default'; danger?: boolean; icon: React.ReactNode } {
  switch (targetStatus) {
    case 'approved':
      return { type: 'primary', icon: <CheckCircleOutlined /> };
    case 'rejected':
      return { type: 'default', danger: true, icon: <CloseCircleOutlined /> };
    case 'published':
    case 'publishing':
      return { type: 'primary', icon: <SendOutlined /> };
    case 'imported':
      return { type: 'default', icon: <RollbackOutlined /> };
    default:
      return { type: 'default', icon: <ArrowRightOutlined /> };
  }
}

export default function WorkflowActions({ article, onStatusChange }: WorkflowActionsProps) {
  const queryClient = useQueryClient();

  const { data: transitionInfo } = useQuery({
    queryKey: [...queryKeys.articles.detail(article.id), 'transitions'],
    queryFn: () => getTransitions(article.id),
  });

  const mutation = useMutation({
    mutationFn: (newStatus: string) =>
      changeStatus(article.id, { new_status: newStatus }),
    onSuccess: (updated) => {
      message.success(`Status changed to "${updated.status}".`);
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(article.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.revisions(article.id) });
      onStatusChange?.(updated);
    },
    onError: () => {
      message.error('Failed to change article status.');
    },
  });

  const allowedTransitions = transitionInfo?.allowed ?? [];

  if (allowedTransitions.length === 0) {
    return null;
  }

  const handleTransition = (targetStatus: string) => {
    const statusMeta = STATUS_MAP[targetStatus as ArticleStatus];
    const label = statusMeta?.label ?? targetStatus;

    showConfirmModal({
      title: 'Confirm Status Change',
      content: `Are you sure you want to change the status to "${label}"?`,
      okText: `Change to ${label}`,
      danger: targetStatus === 'rejected',
      onOk: () => mutation.mutateAsync(targetStatus),
    });
  };

  return (
    <Space wrap>
      {allowedTransitions.map((status) => {
        const statusMeta = STATUS_MAP[status as ArticleStatus];
        const label = statusMeta?.label ?? status;
        const btnProps = getButtonProps(status);

        return (
          <Button
            key={status}
            type={btnProps.type}
            danger={btnProps.danger}
            icon={btnProps.icon}
            onClick={() => handleTransition(status)}
            loading={mutation.isPending}
          >
            {label}
          </Button>
        );
      })}
    </Space>
  );
}

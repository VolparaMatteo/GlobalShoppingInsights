// ---------------------------------------------------------------------------
// BatchActionsBar  --  Floating bar shown when one or more rows are selected
// ---------------------------------------------------------------------------
import { Button, Dropdown, Space, Typography } from 'antd';
import {
  SwapOutlined,
  TagsOutlined,
  DeleteOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { showConfirmModal } from '@/components/common/ConfirmModal';
import { ARTICLE_STATUSES, STATUS_MAP, type ArticleStatus } from '@/config/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchActionType = 'status' | 'tag' | 'discard';

export interface BatchActionPayload {
  type: BatchActionType;
  /** New status value -- only present when type === 'status'. */
  newStatus?: string;
}

interface BatchActionsBarProps {
  selectedIds: React.Key[];
  onAction: (payload: BatchActionPayload) => void;
  onClear: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BatchActionsBar({
  selectedIds,
  onAction,
  onClear,
}: BatchActionsBarProps) {
  if (selectedIds.length === 0) return null;

  // Status dropdown items
  const statusMenuItems: MenuProps['items'] = ARTICLE_STATUSES.map((s) => ({
    key: s,
    label: STATUS_MAP[s].label,
    onClick: () => onAction({ type: 'status', newStatus: s }),
  }));

  const handleDiscard = () => {
    showConfirmModal({
      title: 'Discard selected articles?',
      content: `This will permanently discard ${selectedIds.length} article(s). This action cannot be undone.`,
      okText: 'Discard',
      danger: true,
      onOk: () => onAction({ type: 'discard' }),
    });
  };

  return (
    <div
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: '#fff',
        borderTop: '1px solid #f0f0f0',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.08)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '0 0 8px 8px',
      }}
    >
      <Typography.Text strong>
        {selectedIds.length} selected
      </Typography.Text>

      <Space>
        <Dropdown menu={{ items: statusMenuItems }} trigger={['click']}>
          <Button icon={<SwapOutlined />}>Change Status</Button>
        </Dropdown>

        <Button
          icon={<TagsOutlined />}
          onClick={() => onAction({ type: 'tag' })}
        >
          Add Tags
        </Button>

        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleDiscard}
        >
          Discard
        </Button>

        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClear}
        >
          Clear Selection
        </Button>
      </Space>
    </div>
  );
}

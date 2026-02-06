import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

interface ConfirmModalOptions {
  title: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  onOk: () => void | Promise<void>;
  onCancel?: () => void;
  danger?: boolean;
}

export function showConfirmModal({
  title,
  content,
  okText = 'Confirm',
  cancelText = 'Cancel',
  onOk,
  onCancel,
  danger = false,
}: ConfirmModalOptions) {
  Modal.confirm({
    title,
    icon: <ExclamationCircleOutlined />,
    content,
    okText,
    cancelText,
    okButtonProps: danger ? { danger: true } : undefined,
    onOk,
    onCancel,
  });
}

// ---------------------------------------------------------------------------
// components/common/TypedConfirmModal.tsx — Sprint 7 productivity
//
// Modal di conferma per azioni destructive che chiede all'utente di digitare
// una stringa esatta (es. "SCARTA", "ELIMINA") prima di abilitare il pulsante
// di conferma. Pattern anti-click-wrong di GitHub / Vercel.
//
// Esempio:
//   <TypedConfirmModal
//     open={open}
//     onCancel={close}
//     onConfirm={handleDelete}
//     title="Elimina definitivamente"
//     description="Tutti gli articoli collegati verranno scollegati dal prompt."
//     confirmWord="ELIMINA"
//   />
// ---------------------------------------------------------------------------
import { useEffect, useState } from 'react';

import { Alert, Button, Input, Modal, Space, Typography } from 'antd';

interface TypedConfirmModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  /** La parola che l'utente deve digitare (case-insensitive). */
  confirmWord: string;
  confirmLabel?: string;
  loading?: boolean;
}

export default function TypedConfirmModal({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmWord,
  confirmLabel = 'Conferma',
  loading = false,
}: TypedConfirmModalProps) {
  const [typed, setTyped] = useState('');

  // Reset on open/close
  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const isMatch = typed.trim().toUpperCase() === confirmWord.toUpperCase();

  return (
    <Modal open={open} onCancel={onCancel} title={title} footer={null} width={480} destroyOnClose>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {description && (
          <Typography.Paragraph style={{ margin: 0 }}>{description}</Typography.Paragraph>
        )}

        <Alert
          type="warning"
          showIcon
          message={
            <span>
              Digita <strong>{confirmWord}</strong> per confermare. L'operazione non è reversibile.
            </span>
          }
        />

        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={confirmWord}
          autoFocus
          onPressEnter={() => {
            if (isMatch && !loading) void onConfirm();
          }}
          aria-label={`Digita ${confirmWord} per confermare`}
        />

        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onCancel} disabled={loading}>
            Annulla
          </Button>
          <Button
            type="primary"
            danger
            disabled={!isMatch || loading}
            loading={loading}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </Space>
      </Space>
    </Modal>
  );
}

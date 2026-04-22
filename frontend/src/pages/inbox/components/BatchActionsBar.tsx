// ---------------------------------------------------------------------------
// BatchActionsBar — Sprint 7 polish b10 (floating pill + Lucide + gradient)
// Barra azioni di massa che appare centrata in basso quando c'è una selezione.
// ---------------------------------------------------------------------------
import { App, Button, Dropdown, Space, Typography, theme as antdTheme } from 'antd';
import type { MenuProps } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Tags, Trash2, X } from 'lucide-react';

import { ARTICLE_STATUSES, STATUS_MAP } from '@/config/constants';

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BatchActionType = 'status' | 'tag' | 'discard';

export interface BatchActionPayload {
  type: BatchActionType;
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

export default function BatchActionsBar({ selectedIds, onAction, onClear }: BatchActionsBarProps) {
  const { token } = antdTheme.useToken();
  const { modal } = App.useApp();
  const visible = selectedIds.length > 0;

  const statusMenuItems: MenuProps['items'] = ARTICLE_STATUSES.map((s) => ({
    key: s,
    label: STATUS_MAP[s].label,
    onClick: () => onAction({ type: 'status', newStatus: s }),
  }));

  const handleDiscard = () => {
    modal.confirm({
      title: 'Scartare gli articoli selezionati?',
      content: `Verranno scartati permanentemente ${selectedIds.length} articolo/i. Questa azione non può essere annullata.`,
      okText: 'Scarta',
      okButtonProps: { danger: true },
      cancelText: 'Annulla',
      centered: true,
      onOk: () => onAction({ type: 'discard' }),
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="batch-actions-bar"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            bottom: 24,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            zIndex: 30,
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '10px 16px 10px 18px',
              background: token.colorBgElevated,
              borderRadius: 14,
              border: `1px solid ${token.colorBorderSecondary}`,
              boxShadow:
                '0 16px 48px -12px rgba(22,119,255,0.25), 0 6px 18px -4px rgba(0,0,0,0.15)',
              backdropFilter: 'saturate(180%) blur(8px)',
            }}
          >
            {/* Counter gradient */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                borderRadius: 10,
                background:
                  'linear-gradient(135deg, rgba(22,119,255,0.12) 0%, rgba(114,46,209,0.12) 100%)',
                border: `1px solid ${token.colorPrimary}33`,
              }}
            >
              <Text
                strong
                style={{
                  color: token.colorPrimary,
                  fontSize: 13,
                  fontVariantNumeric: 'tabular-nums',
                  lineHeight: 1,
                }}
              >
                {selectedIds.length}
              </Text>
              <Text style={{ color: token.colorPrimary, fontSize: 12, lineHeight: 1 }}>
                {selectedIds.length === 1 ? 'selezionato' : 'selezionati'}
              </Text>
            </div>

            <Space size={6}>
              <Dropdown menu={{ items: statusMenuItems }} trigger={['click']} placement="topLeft">
                <Button
                  icon={<ArrowLeftRight size={14} />}
                  style={{ borderRadius: 8, fontWeight: 500, height: 34 }}
                >
                  Cambia stato
                </Button>
              </Dropdown>

              <Button
                icon={<Tags size={14} />}
                onClick={() => onAction({ type: 'tag' })}
                style={{ borderRadius: 8, fontWeight: 500, height: 34 }}
              >
                Tag
              </Button>

              <Button
                danger
                icon={<Trash2 size={14} />}
                onClick={handleDiscard}
                style={{ borderRadius: 8, fontWeight: 500, height: 34 }}
              >
                Scarta
              </Button>
            </Space>

            <div style={{ width: 1, height: 22, background: token.colorBorderSecondary }} />

            <Button
              type="text"
              size="small"
              icon={<X size={14} />}
              onClick={onClear}
              aria-label="Deseleziona tutto"
              style={{
                borderRadius: 8,
                color: token.colorTextSecondary,
                height: 30,
                padding: '0 10px',
              }}
            >
              Annulla
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

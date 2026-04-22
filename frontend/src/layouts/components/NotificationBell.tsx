// ---------------------------------------------------------------------------
// NotificationBell.tsx — Sprint 7 polish b6 (Lucide + design coerente)
// ---------------------------------------------------------------------------
import { useState } from 'react';

import { Button, Dropdown, Empty, List, theme as antdTheme, Tooltip, Typography } from 'antd';
import { Bell, Check, CheckCheck } from 'lucide-react';

import { useNotificationStore } from '@/stores/notificationStore';

const { Text } = Typography;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { token } = antdTheme.useToken();

  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const dropdownContent = (
    <div
      style={{
        width: 380,
        maxHeight: 440,
        overflow: 'auto',
        background: token.colorBgElevated,
        borderRadius: 12,
        border: `1px solid ${token.colorBorderSecondary}`,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 18px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div>
          <Text strong style={{ fontSize: 14, color: token.colorText }}>
            Notifiche
          </Text>
          {unreadCount > 0 && (
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
              {unreadCount} da leggere
            </Text>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<CheckCheck size={13} />}
            onClick={markAllAsRead}
            style={{ fontSize: 12 }}
          >
            Segna tutte
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div style={{ padding: '32px 16px' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">Nessuna notifica</Text>}
          />
        </div>
      ) : (
        <List
          dataSource={notifications.slice(0, 10)}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '12px 18px',
                cursor: 'pointer',
                background: item.read ? 'transparent' : `${token.colorPrimary}0a`,
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
                transition: 'background 150ms',
                position: 'relative',
              }}
              onClick={() => markAsRead(item.id)}
            >
              {!item.read && (
                <span
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                    boxShadow: '0 0 0 3px rgba(22,119,255,0.12)',
                  }}
                />
              )}
              <List.Item.Meta
                style={{ marginLeft: item.read ? 0 : 12 }}
                title={
                  <Text
                    style={{
                      fontWeight: item.read ? 400 : 600,
                      fontSize: 13,
                      color: token.colorText,
                    }}
                  >
                    {item.title}
                  </Text>
                }
                description={
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {item.message}
                  </Text>
                }
              />
              {item.read && <Check size={13} color={token.colorTextTertiary} />}
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdownContent}
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
    >
      <Tooltip title="Notifiche" placement="bottom">
        <div style={{ position: 'relative', display: 'inline-flex' }}>
          <Button
            type="text"
            shape="circle"
            icon={<Bell size={18} />}
            aria-label={`Notifiche${unreadCount > 0 ? ` — ${unreadCount} da leggere` : ''}`}
          />
          {unreadCount > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                minWidth: 16,
                height: 16,
                padding: '0 4px',
                borderRadius: 8,
                fontSize: 10,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                boxShadow: '0 2px 6px rgba(22,119,255,0.4)',
                border: `2px solid ${token.colorBgContainer}`,
                lineHeight: 1,
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </Tooltip>
    </Dropdown>
  );
}

import { useState } from 'react';
import { Badge, Button, Dropdown, Empty, List, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNotificationStore } from '@/stores/notificationStore';

const { Text } = Typography;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const notifications = useNotificationStore((s) => s.notifications);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);

  const dropdownContent = (
    <div
      style={{
        width: 360,
        maxHeight: 400,
        overflow: 'auto',
        background: '#fff',
        borderRadius: 8,
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.08)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button type="link" size="small" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No notifications"
          style={{ padding: '24px 0' }}
        />
      ) : (
        <List
          dataSource={notifications.slice(0, 10)}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '10px 16px',
                cursor: 'pointer',
                background: item.read ? 'transparent' : '#f6ffed',
              }}
              onClick={() => markAsRead(item.id)}
            >
              <List.Item.Meta
                title={
                  <Text
                    style={{
                      fontWeight: item.read ? 400 : 600,
                      fontSize: 13,
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
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <Button
          type="text"
          icon={<BellOutlined style={{ fontSize: 18 }} />}
          style={{ display: 'flex', alignItems: 'center' }}
        />
      </Badge>
    </Dropdown>
  );
}

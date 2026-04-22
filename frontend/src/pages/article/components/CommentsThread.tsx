// ---------------------------------------------------------------------------
// CommentsThread.tsx  --  Article comments list with add-comment form
// ---------------------------------------------------------------------------
import { useState } from 'react';
import { Card, List, Typography, Input, Button, Space, Avatar, Empty, Spin, message } from 'antd';
import { CommentOutlined, UserOutlined, SendOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getComments, addComment } from '@/services/api/comments.api';
import { queryKeys } from '@/config/queryKeys';
import RelativeTime from '@/components/common/RelativeTime';

interface CommentsThreadProps {
  articleId: number;
}

export default function CommentsThread({ articleId }: CommentsThreadProps) {
  const [newComment, setNewComment] = useState('');
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: queryKeys.articles.comments(articleId),
    queryFn: () => getComments(articleId),
  });

  const addMutation = useMutation({
    mutationFn: (body: string) => addComment(articleId, { body }),
    onSuccess: () => {
      message.success('Commento aggiunto.');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.comments(articleId) });
    },
    onError: () => message.error('Impossibile aggiungere il commento.'),
  });

  const handleSubmit = () => {
    const trimmed = newComment.trim();
    if (!trimmed) return;
    addMutation.mutate(trimmed);
  };

  return (
    <Card
      title={
        <Space>
          <CommentOutlined />
          Commenti
          {comments && comments.length > 0 && (
            <Typography.Text type="secondary">({comments.length})</Typography.Text>
          )}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 24 }}>
          <Spin />
        </div>
      ) : !comments || comments.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Nessun commento"
          style={{ marginBottom: 24 }}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={comments}
          style={{ marginBottom: 24 }}
          renderItem={(comment) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} size="small" />}
                title={
                  <Space>
                    <Typography.Text strong>
                      {comment.user_name ?? `Utente #${comment.user_id}`}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      <RelativeTime date={comment.created_at} />
                    </Typography.Text>
                  </Space>
                }
                description={
                  <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {comment.body}
                  </Typography.Paragraph>
                }
              />
            </List.Item>
          )}
        />
      )}

      {/* Add comment form */}
      <div>
        <Input.TextArea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Scrivi un commento..."
          rows={3}
          onPressEnter={(e) => {
            if (e.ctrlKey || e.metaKey) handleSubmit();
          }}
        />
        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={addMutation.isPending}
            disabled={!newComment.trim()}
          >
            Invia
          </Button>
        </div>
      </div>
    </Card>
  );
}

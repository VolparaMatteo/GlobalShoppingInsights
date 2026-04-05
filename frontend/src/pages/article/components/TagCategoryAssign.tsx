// ---------------------------------------------------------------------------
// TagCategoryAssign.tsx  --  Tag & Category assignment sidebar card
// ---------------------------------------------------------------------------
import { Card, Tag, Select, Space, Typography, Divider, Flex, message } from 'antd';
import { TagsOutlined, AppstoreOutlined, PlusOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Article } from '@/types';
import { batchAction } from '@/services/api/articles.api';
import { useTags, useCategories } from '@/hooks/queries/useTaxonomy';
import { queryKeys } from '@/config/queryKeys';

interface TagCategoryAssignProps {
  article: Article;
}

export default function TagCategoryAssign({ article }: TagCategoryAssignProps) {
  const queryClient = useQueryClient();

  const { data: allTagsData } = useTags();
  const { data: allCategoriesData } = useCategories();

  const allTags = allTagsData?.items ?? [];
  const allCategories = allCategoriesData?.items ?? [];

  const currentTagIds = new Set(article.tags.map((t) => t.id));
  const currentCategoryIds = new Set(article.categories.map((c) => c.id));

  const tagOptions = allTags
    .filter((t) => !currentTagIds.has(t.id))
    .map((t) => ({ label: t.name, value: t.id }));

  const categoryOptions = allCategories
    .filter((c) => !currentCategoryIds.has(c.id))
    .map((c) => ({ label: c.name, value: c.id }));

  const tagMutation = useMutation({
    mutationFn: (tagIds: number[]) =>
      batchAction({
        article_ids: [article.id],
        action: 'tag',
        tag_ids: tagIds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.articles.detail(article.id) });
      message.success('Tag aggiornati');
    },
    onError: () => message.error('Impossibile aggiornare i tag'),
  });

  const handleAddTag = (tagId: number) => {
    tagMutation.mutate([tagId]);
  };

  return (
    <Card title="Tag e Categorie" size="small" style={{ marginBottom: 16 }}>
      {/* Tags */}
      <div style={{ marginBottom: 16 }}>
        <Typography.Text
          type="secondary"
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            display: 'block',
            marginBottom: 8,
          }}
        >
          <TagsOutlined style={{ marginRight: 4 }} />
          Tags
        </Typography.Text>

        <Flex wrap="wrap" gap={6} style={{ marginBottom: 8 }}>
          {article.tags.length > 0 ? (
            article.tags.map((tag) => (
              <Tag key={tag.id} color="blue">
                {tag.name}
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Nessun tag assegnato
            </Typography.Text>
          )}
        </Flex>

        <Select
          placeholder="Aggiungi tag..."
          options={tagOptions}
          onSelect={handleAddTag}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
          size="small"
          value={undefined}
          loading={tagMutation.isPending}
        />
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Categories */}
      <div>
        <Typography.Text
          type="secondary"
          style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            display: 'block',
            marginBottom: 8,
          }}
        >
          <AppstoreOutlined style={{ marginRight: 4 }} />
          Categorie
        </Typography.Text>

        <Flex wrap="wrap" gap={6} style={{ marginBottom: 8 }}>
          {article.categories.length > 0 ? (
            article.categories.map((cat) => (
              <Tag key={cat.id} color="purple">
                {cat.name}
              </Tag>
            ))
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Nessuna categoria assegnata
            </Typography.Text>
          )}
        </Flex>

        <Select
          placeholder="Aggiungi categoria..."
          options={categoryOptions}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
          size="small"
          value={undefined}
        />
      </div>
    </Card>
  );
}

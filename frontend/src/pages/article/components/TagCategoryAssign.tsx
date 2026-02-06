// ---------------------------------------------------------------------------
// TagCategoryAssign.tsx  --  Tag & Category assignment sidebar card
// ---------------------------------------------------------------------------
import React from 'react';
import { Card, Tag, Select, Space, Typography, Divider, Empty, message } from 'antd';
import { TagsOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Article, Tag as TagType, Category } from '@/types';
import { getTags, getCategories } from '@/services/api/taxonomy.api';
import { updateArticle } from '@/services/api/articles.api';
import { queryKeys } from '@/config/queryKeys';

interface TagCategoryAssignProps {
  article: Article;
  tags?: TagType[];
  categories?: Category[];
}

export default function TagCategoryAssign({ article }: TagCategoryAssignProps) {
  const queryClient = useQueryClient();

  const { data: allTagsData } = useQuery({
    queryKey: queryKeys.taxonomy.tags(),
    queryFn: () => getTags({ page_size: 200 }),
  });

  const { data: allCategoriesData } = useQuery({
    queryKey: queryKeys.taxonomy.categories(),
    queryFn: () => getCategories({ page_size: 200 }),
  });

  const allTags = allTagsData?.items ?? [];
  const allCategories = allCategoriesData?.items ?? [];

  // Current assigned IDs
  const currentTagIds = article.tags.map((t) => t.id);
  const currentCategoryIds = article.categories.map((c) => c.id);

  // Batch action to assign tags/categories -- uses the batch endpoint
  // For simplicity, re-using updateArticle (which triggers revision creation)
  // The actual tag/category assignment would be via a dedicated endpoint in production.

  const tagOptions = allTags
    .filter((t) => !currentTagIds.includes(t.id))
    .map((t) => ({ label: t.name, value: t.id }));

  const categoryOptions = allCategories
    .filter((c) => !currentCategoryIds.includes(c.id))
    .map((c) => ({ label: c.name, value: c.id }));

  const handleAddTag = (tagId: number) => {
    message.info(`Tag assignment would add tag #${tagId} to article #${article.id}.`);
    // In a full implementation, this would call a dedicated API endpoint
    // and then invalidate the article query.
  };

  const handleRemoveTag = (tagId: number) => {
    message.info(`Tag removal would remove tag #${tagId} from article #${article.id}.`);
  };

  const handleAddCategory = (categoryId: number) => {
    message.info(`Category assignment would add category #${categoryId} to article #${article.id}.`);
  };

  const handleRemoveCategory = (categoryId: number) => {
    message.info(`Category removal would remove category #${categoryId} from article #${article.id}.`);
  };

  return (
    <Card title="Tags & Categories" size="small" style={{ marginBottom: 16 }}>
      {/* Tags section */}
      <div style={{ marginBottom: 16 }}>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          <TagsOutlined style={{ marginRight: 4 }} />
          Tags
        </Typography.Text>

        {article.tags.length > 0 ? (
          <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
            {article.tags.map((tag) => (
              <Tag
                key={tag.id}
                closable
                onClose={(e) => {
                  e.preventDefault();
                  handleRemoveTag(tag.id);
                }}
                color="blue"
              >
                {tag.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              No tags assigned
            </Typography.Text>
          </div>
        )}

        <Select
          placeholder="Add tag..."
          options={tagOptions}
          onSelect={handleAddTag}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
          value={undefined}
        />
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Categories section */}
      <div>
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          <AppstoreOutlined style={{ marginRight: 4 }} />
          Categories
        </Typography.Text>

        {article.categories.length > 0 ? (
          <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
            {article.categories.map((cat) => (
              <Tag
                key={cat.id}
                closable
                onClose={(e) => {
                  e.preventDefault();
                  handleRemoveCategory(cat.id);
                }}
                color="purple"
              >
                {cat.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <div style={{ marginBottom: 8 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              No categories assigned
            </Typography.Text>
          </div>
        )}

        <Select
          placeholder="Add category..."
          options={categoryOptions}
          onSelect={handleAddCategory}
          showSearch
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          style={{ width: '100%' }}
          value={undefined}
        />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ArticleContent.tsx  --  Article content display (clean text + images)
// ---------------------------------------------------------------------------
import { Card, Image, Typography, Flex } from 'antd';
import type { Article } from '@/types';

interface ArticleContentProps {
  article: Article;
}

const IMG_FALLBACK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg==';

export default function ArticleContent({ article }: ArticleContentProps) {
  // Collect all images: featured first, then additional images
  const allImages: string[] = [];
  if (article.featured_image_url) allImages.push(article.featured_image_url);
  if (article.images?.length) {
    for (const img of article.images) {
      if (img !== article.featured_image_url) allImages.push(img);
    }
  }

  // Prefer content_text (clean plain text) over content_html (may contain raw tags)
  const textContent = article.content_text || null;

  return (
    <Card title="Contenuto" style={{ marginBottom: 16 }}>
      {/* Images */}
      {allImages.length > 0 && (
        <Flex wrap="wrap" gap={12} justify="center" style={{ marginBottom: 20 }}>
          <Image.PreviewGroup>
            {allImages.map((src, i) => (
              <Image
                key={i}
                src={src}
                alt={`${article.title} - immagine ${i + 1}`}
                style={{
                  maxWidth: '100%',
                  maxHeight: 400,
                  objectFit: 'cover',
                  borderRadius: 8,
                }}
                fallback={IMG_FALLBACK}
              />
            ))}
          </Image.PreviewGroup>
        </Flex>
      )}

      {/* Text content */}
      {textContent ? (
        <Typography.Paragraph
          style={{
            whiteSpace: 'pre-wrap',
            lineHeight: 1.8,
            margin: 0,
            fontSize: 15,
          }}
        >
          {textContent}
        </Typography.Paragraph>
      ) : (
        <Typography.Text type="secondary" italic>
          Nessun contenuto disponibile per questo articolo.
        </Typography.Text>
      )}
    </Card>
  );
}

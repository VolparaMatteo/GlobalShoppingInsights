// ---------------------------------------------------------------------------
// ImagePickerModal.tsx  --  Unsplash image search & selection modal
// ---------------------------------------------------------------------------
import { useCallback, useEffect, useState } from 'react';
import { Button, Empty, Flex, Input, Modal, Pagination, Spin, Typography, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { searchUnsplash, trackDownload, type UnsplashPhoto } from '@/services/api/unsplash.api';

interface ImagePickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageUrl: string) => void;
  /** Used to pre-fill the search query (first 4 words). */
  articleTitle?: string;
}

function buildInitialQuery(title?: string): string {
  if (!title) return '';
  return title.split(/\s+/).slice(0, 4).join(' ');
}

export default function ImagePickerModal({
  open,
  onClose,
  onSelect,
  articleTitle,
}: ImagePickerModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UnsplashPhoto[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<UnsplashPhoto | null>(null);

  // Pre-fill query when modal opens
  useEffect(() => {
    if (open) {
      const initial = buildInitialQuery(articleTitle);
      setQuery(initial);
      setSelected(null);
      setResults([]);
      setPage(1);
      if (initial) {
        doSearch(initial, 1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, articleTitle]);

  const doSearch = useCallback(async (q: string, p: number) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const data = await searchUnsplash(q.trim(), p);
      setResults(data.results);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch {
      message.error('Errore nella ricerca Unsplash');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    setPage(1);
    setSelected(null);
    doSearch(query, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setSelected(null);
    doSearch(query, newPage);
  };

  const handleConfirm = async () => {
    if (!selected) return;
    try {
      await trackDownload(selected.download_location);
    } catch {
      // non-blocking: tracking is best-effort
    }
    onSelect(selected.regular);
    onClose();
  };

  return (
    <Modal
      title="Cerca immagine su Unsplash"
      open={open}
      onCancel={onClose}
      width={720}
      footer={
        <Flex justify="space-between" align="center">
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Foto da{' '}
            <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer">
              Unsplash
            </a>
          </Typography.Text>
          <Button type="primary" disabled={!selected} onClick={handleConfirm}>
            Usa immagine
          </Button>
        </Flex>
      }
      destroyOnClose
    >
      {/* Search bar */}
      <Input.Search
        placeholder="Cerca immagini..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onSearch={handleSearch}
        enterButton={
          <>
            <SearchOutlined /> Cerca
          </>
        }
        style={{ marginBottom: 16 }}
        allowClear
      />

      {/* Results grid */}
      {loading ? (
        <Flex justify="center" align="center" style={{ minHeight: 200 }}>
          <Spin size="large" />
        </Flex>
      ) : results.length === 0 ? (
        <Empty
          description={total === 0 && query ? 'Nessun risultato' : "Cerca un'immagine per iniziare"}
          style={{
            minHeight: 200,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        />
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {results.map((photo) => {
              const isSelected = selected?.id === photo.id;
              return (
                <div
                  key={photo.id}
                  onClick={() => setSelected(photo)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <img
                    src={photo.small}
                    alt={`Foto di ${photo.photographer}`}
                    style={{
                      width: '100%',
                      height: 120,
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  <div
                    style={{
                      padding: '4px 6px',
                      fontSize: 11,
                      color: '#595959',
                      background: '#fafafa',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <a
                      href={`${photo.photographer_url}?utm_source=gsi&utm_medium=referral`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#595959' }}
                    >
                      {photo.photographer}
                    </a>{' '}
                    /{' '}
                    <a
                      href="https://unsplash.com?utm_source=gsi&utm_medium=referral"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#595959' }}
                    >
                      Unsplash
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <Flex justify="center">
              <Pagination
                current={page}
                total={total}
                pageSize={12}
                onChange={handlePageChange}
                showSizeChanger={false}
                size="small"
              />
            </Flex>
          )}
        </>
      )}
    </Modal>
  );
}

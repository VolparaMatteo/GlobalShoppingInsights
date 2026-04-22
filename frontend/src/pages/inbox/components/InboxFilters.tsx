// ---------------------------------------------------------------------------
// InboxFilters  --  Filter bar for the Inbox article list
// ---------------------------------------------------------------------------
import { useCallback, useMemo } from 'react';
import { Input, Select, Slider, Button, Space, Row, Col } from 'antd';
import { SearchOutlined, ClearOutlined } from '@ant-design/icons';
import { ARTICLE_STATUSES, STATUS_MAP, type ArticleStatus } from '@/config/constants';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InboxFilterValues {
  search: string;
  statuses: string[];
  language: string | undefined;
  minScore: number;
  maxScore: number;
  domain: string;
  country: string | undefined;
}

export const DEFAULT_FILTERS: InboxFilterValues = {
  search: '',
  statuses: [],
  language: undefined,
  minScore: 0,
  maxScore: 100,
  domain: '',
  country: undefined,
};

interface InboxFiltersProps {
  filters: InboxFilterValues;
  onFiltersChange: (filters: InboxFilterValues) => void;
}

// ---------------------------------------------------------------------------
// Statics
// ---------------------------------------------------------------------------

const statusOptions = ARTICLE_STATUSES.map((s) => ({
  label: STATUS_MAP[s].label,
  value: s,
}));

const languageOptions = [
  { label: 'Inglese', value: 'en' },
  { label: 'Francese', value: 'fr' },
  { label: 'Tedesco', value: 'de' },
  { label: 'Spagnolo', value: 'es' },
  { label: 'Italiano', value: 'it' },
  { label: 'Portoghese', value: 'pt' },
  { label: 'Olandese', value: 'nl' },
  { label: 'Giapponese', value: 'ja' },
  { label: 'Cinese', value: 'zh' },
  { label: 'Coreano', value: 'ko' },
];

const countryOptions = [
  { label: 'Stati Uniti', value: 'US' },
  { label: 'Regno Unito', value: 'GB' },
  { label: 'Canada', value: 'CA' },
  { label: 'Germania', value: 'DE' },
  { label: 'Francia', value: 'FR' },
  { label: 'Spagna', value: 'ES' },
  { label: 'Italia', value: 'IT' },
  { label: 'Giappone', value: 'JP' },
  { label: 'Cina', value: 'CN' },
  { label: 'Australia', value: 'AU' },
  { label: 'Brasile', value: 'BR' },
  { label: 'India', value: 'IN' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InboxFilters({ filters, onFiltersChange }: InboxFiltersProps) {
  /** Helper to patch a single field while keeping the rest intact. */
  const patch = useCallback(
    (partial: Partial<InboxFilterValues>) => {
      onFiltersChange({ ...filters, ...partial });
    },
    [filters, onFiltersChange],
  );

  const handleClear = useCallback(() => {
    onFiltersChange({ ...DEFAULT_FILTERS });
  }, [onFiltersChange]);

  const isDirty = useMemo(() => {
    return (
      filters.search !== DEFAULT_FILTERS.search ||
      filters.statuses.length !== 0 ||
      filters.language !== DEFAULT_FILTERS.language ||
      filters.minScore !== DEFAULT_FILTERS.minScore ||
      filters.maxScore !== DEFAULT_FILTERS.maxScore ||
      filters.domain !== DEFAULT_FILTERS.domain ||
      filters.country !== DEFAULT_FILTERS.country
    );
  }, [filters]);

  // Debounce is left to the parent (InboxPage) so that this component
  // remains a controlled, stateless filter bar.

  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]} align="middle">
        {/* ---- Search ---- */}
        <Col xs={24} sm={12} md={6}>
          <Input
            placeholder="Cerca articoli..."
            prefix={<SearchOutlined />}
            allowClear
            value={filters.search}
            onChange={(e) => patch({ search: e.target.value })}
          />
        </Col>

        {/* ---- Status multi-select ---- */}
        <Col xs={24} sm={12} md={5}>
          <Select
            mode="multiple"
            placeholder="Stato"
            allowClear
            maxTagCount="responsive"
            style={{ width: '100%' }}
            options={statusOptions}
            value={filters.statuses}
            onChange={(statuses) => patch({ statuses })}
          />
        </Col>

        {/* ---- Language ---- */}
        <Col xs={24} sm={12} md={3}>
          <Select
            placeholder="Lingua"
            allowClear
            style={{ width: '100%' }}
            options={languageOptions}
            value={filters.language}
            onChange={(language) => patch({ language })}
          />
        </Col>

        {/* ---- AI Score Range ---- */}
        <Col xs={24} sm={12} md={4}>
          <Slider
            range
            min={0}
            max={100}
            value={[filters.minScore, filters.maxScore]}
            onChange={([min, max]: number[]) => patch({ minScore: min, maxScore: max })}
            tooltip={{ formatter: (v) => `Punteggio: ${v}` }}
          />
        </Col>

        {/* ---- Domain ---- */}
        <Col xs={24} sm={12} md={3}>
          <Input
            placeholder="Dominio"
            allowClear
            value={filters.domain}
            onChange={(e) => patch({ domain: e.target.value })}
          />
        </Col>

        {/* ---- Country ---- */}
        <Col xs={24} sm={12} md={2}>
          <Select
            placeholder="Paese"
            allowClear
            style={{ width: '100%' }}
            options={countryOptions}
            value={filters.country}
            onChange={(country) => patch({ country })}
          />
        </Col>

        {/* ---- Clear Filters ---- */}
        <Col flex="none">
          <Button icon={<ClearOutlined />} disabled={!isDirty} onClick={handleClear}>
            Pulisci Filtri
          </Button>
        </Col>
      </Row>
    </div>
  );
}

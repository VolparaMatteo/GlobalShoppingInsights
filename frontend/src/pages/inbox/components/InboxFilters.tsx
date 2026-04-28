// ---------------------------------------------------------------------------
// InboxFilters — Sprint 7 polish b10 (Lucide + dark-mode aware)
// Barra filtri della Inbox: search, stato, lingua, categoria,
// punteggio AI (range), clear.
// ---------------------------------------------------------------------------
import { useCallback, useMemo } from 'react';

import { Button, Col, Input, Row, Select, Slider, Typography, theme as antdTheme } from 'antd';
import { FilterX, Search, SlidersHorizontal } from 'lucide-react';

import {
  ARTICLE_CATEGORIES,
  MANUAL_ARTICLE_STATUSES,
  STATUS_MAP,
} from '@/config/constants';

const { Text } = Typography;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface InboxFilterValues {
  search: string;
  statuses: string[];
  language: string | undefined;
  categories: string[];
  minScore: number;
  maxScore: number;
}

export const DEFAULT_FILTERS: InboxFilterValues = {
  search: '',
  statuses: [],
  language: undefined,
  categories: [],
  minScore: 0,
  maxScore: 100,
};

interface InboxFiltersProps {
  filters: InboxFilterValues;
  onFiltersChange: (filters: InboxFilterValues) => void;
}

// ---------------------------------------------------------------------------
// Statics
// ---------------------------------------------------------------------------

const statusOptions = MANUAL_ARTICLE_STATUSES.map((s) => ({
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

// Opzioni del Select 'Categoria' con icona + cerchio colorato del brand.
// Il label è un ReactNode così Antd Select lo renderizza nel dropdown
// e nella tag selezionata.
const categoryOptions = ARTICLE_CATEGORIES.map((cat) => ({
  value: cat.name,
  label: (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: cat.color,
          display: 'inline-block',
          flexShrink: 0,
        }}
      />
      <span>
        {cat.icon} {cat.name}
      </span>
    </span>
  ),
}));

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InboxFilters({ filters, onFiltersChange }: InboxFiltersProps) {
  const { token } = antdTheme.useToken();

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
      filters.categories.length !== 0 ||
      filters.minScore !== DEFAULT_FILTERS.minScore ||
      filters.maxScore !== DEFAULT_FILTERS.maxScore
    );
  }, [filters]);

  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[12, 12]} align="middle">
        {/* Search */}
        <Col xs={24} sm={12} md={7}>
          <Input
            placeholder="Cerca per titolo o contenuto…"
            prefix={<Search size={15} style={{ color: token.colorTextTertiary }} />}
            allowClear
            value={filters.search}
            onChange={(e) => patch({ search: e.target.value })}
            style={{ height: 40, borderRadius: 10 }}
          />
        </Col>

        {/* Status multi-select */}
        <Col xs={24} sm={12} md={4}>
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

        {/* Language */}
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

        {/* Category multi-select (macrocategoria editoriale) */}
        <Col xs={24} sm={24} md={8}>
          <Select
            mode="multiple"
            placeholder="Categoria editoriale"
            allowClear
            maxTagCount="responsive"
            style={{ width: '100%' }}
            options={categoryOptions}
            value={filters.categories}
            onChange={(categories) => patch({ categories })}
          />
        </Col>

        {/* Clear */}
        <Col flex="none">
          <Button
            icon={<FilterX size={14} />}
            disabled={!isDirty}
            onClick={handleClear}
            style={{ borderRadius: 8 }}
          >
            Pulisci
          </Button>
        </Col>
      </Row>

      {/* Score range — riga dedicata per evitare squeeze orizzontale */}
      <Row gutter={[12, 8]} align="middle" style={{ marginTop: 12 }}>
        <Col flex="none">
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: token.colorTextSecondary,
            }}
          >
            <SlidersHorizontal size={13} />
            Punteggio AI
          </span>
        </Col>
        <Col flex="auto" style={{ maxWidth: 420, paddingLeft: 16 }}>
          <Slider
            range
            min={0}
            max={100}
            value={[filters.minScore, filters.maxScore]}
            onChange={([min, max]: number[]) => patch({ minScore: min, maxScore: max })}
            tooltip={{ formatter: (v) => `${v}` }}
          />
        </Col>
        <Col flex="none">
          <Text
            style={{
              fontSize: 12,
              color: token.colorTextTertiary,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {filters.minScore} – {filters.maxScore}
          </Text>
        </Col>
      </Row>
    </div>
  );
}

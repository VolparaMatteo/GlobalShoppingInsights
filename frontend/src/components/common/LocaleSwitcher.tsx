// ---------------------------------------------------------------------------
// components/common/LocaleSwitcher.tsx — Sprint 7 a11y+i18n
//
// Dropdown IT/EN montato nell'header. Persiste la preferenza in localStorage
// (gestito da i18next detector).
// ---------------------------------------------------------------------------
import { Dropdown, Tooltip, Button } from 'antd';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'it', label: 'Italiano' },
  { code: 'en', label: 'English' },
];

export default function LocaleSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? 'it';

  const items = LANGUAGES.map((l) => ({
    key: l.code,
    label: l.label,
    disabled: l.code === current,
  }));

  return (
    <Dropdown
      menu={{
        items,
        onClick: ({ key }) => {
          void i18n.changeLanguage(key);
        },
      }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Tooltip title="Cambia lingua / Change language" placement="bottom">
        <Button
          type="text"
          shape="circle"
          icon={<Languages size={18} />}
          aria-label={`Lingua corrente: ${current === 'it' ? 'Italiano' : 'English'}`}
        />
      </Tooltip>
    </Dropdown>
  );
}

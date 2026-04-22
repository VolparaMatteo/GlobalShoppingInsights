// ---------------------------------------------------------------------------
// components/common/ThemeToggle.tsx
//
// Toggle light/dark mode montato nell'header. Usa Lucide icons (Moon/Sun)
// e Ant Design Tooltip. Preferenza persistita in localStorage via uiStore.
// ---------------------------------------------------------------------------
import { Button, Tooltip } from 'antd';
import { Moon, Sun } from 'lucide-react';
import { useUiStore } from '@/stores/uiStore';

export default function ThemeToggle() {
  const themeMode = useUiStore((s) => s.themeMode);
  const toggle = useUiStore((s) => s.toggleThemeMode);

  const isDark = themeMode === 'dark';
  const label = isDark ? 'Passa a tema chiaro' : 'Passa a tema scuro';

  return (
    <Tooltip title={label} placement="bottom">
      <Button
        type="text"
        shape="circle"
        onClick={toggle}
        aria-label={label}
        icon={isDark ? <Sun size={18} /> : <Moon size={18} />}
      />
    </Tooltip>
  );
}

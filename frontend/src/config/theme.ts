// ---------------------------------------------------------------------------
// config/theme.ts — Ant Design theme build from design tokens
// ---------------------------------------------------------------------------
//
// Fonte della verità: src/theme/tokens.ts
// Esporta `themeForMode(mode)` che produce il ThemeConfig di AntD da
// consumare nel <ConfigProvider theme={...}>.
//
// Dark mode: usa `theme.darkAlgorithm` di AntD come base, poi overridiamo
// con i nostri token semantic per tenere brand + status consistent.
// ---------------------------------------------------------------------------

import { theme as antdTheme, type ThemeConfig } from 'antd';

import { LAYOUT, RADIUS, TYPOGRAPHY, tokensFor, type SemanticTokens } from '@/theme/tokens';

export type ThemeMode = 'light' | 'dark';

function componentsOverride(tokens: SemanticTokens, mode: ThemeMode) {
  return {
    Layout: {
      headerBg: tokens.colorBgContainer,
      siderBg: tokens.colorBgSidebar,
      bodyBg: tokens.colorBgLayout,
    },
    Menu: {
      darkItemBg: tokens.colorBgSidebar,
      darkSubMenuItemBg: mode === 'dark' ? '#000000' : '#000c17',
    },
    Table: {
      headerBg: mode === 'dark' ? tokens.colorBgElevated : '#fafafa',
      rowHoverBg: mode === 'dark' ? tokens.colorBgElevated : '#fafafa',
    },
    Card: {
      paddingLG: 20,
      colorBgContainer: tokens.colorBgContainer,
    },
    Tag: {
      // Tag custom StatusBadge/ScoreBadge sovrascrivono, questi sono fallback.
      borderRadiusSM: RADIUS.sm,
    },
    Button: {
      borderRadius: RADIUS.md,
      fontWeight: TYPOGRAPHY.fontWeight.medium,
    },
    Input: {
      borderRadius: RADIUS.md,
    },
    Select: {
      borderRadius: RADIUS.md,
    },
    Modal: {
      borderRadiusLG: RADIUS.lg,
    },
    Drawer: {
      borderRadiusLG: RADIUS.lg,
    },
  } as const;
}

export function themeForMode(mode: ThemeMode): ThemeConfig {
  const tokens = tokensFor(mode);
  return {
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      // Brand
      colorPrimary: tokens.colorPrimary,
      colorInfo: tokens.colorInfo,
      colorSuccess: tokens.colorSuccess,
      colorWarning: tokens.colorWarning,
      colorError: tokens.colorDanger,

      // Typography
      fontFamily: TYPOGRAPHY.fontFamily.base,
      fontFamilyCode: TYPOGRAPHY.fontFamily.mono,
      fontSize: TYPOGRAPHY.fontSize.base,
      lineHeight: TYPOGRAPHY.lineHeight.base,

      // Radius
      borderRadius: RADIUS.md,
      borderRadiusSM: RADIUS.sm,
      borderRadiusLG: RADIUS.lg,

      // Layout backgrounds
      colorBgLayout: tokens.colorBgLayout,
      colorBgContainer: tokens.colorBgContainer,
      colorBgElevated: tokens.colorBgElevated,
      colorBgBase: tokens.colorBgBase,

      // Text
      colorText: tokens.colorTextPrimary,
      colorTextSecondary: tokens.colorTextSecondary,
      colorTextTertiary: tokens.colorTextTertiary,
      colorTextQuaternary: tokens.colorTextDisabled,

      // Borders
      colorBorder: tokens.colorBorder,
      colorBorderSecondary: tokens.colorBorderSecondary,

      // Layout sizing — sider/header
      controlHeight: 36,

      // Misc
      wireframe: false,
    },
    components: componentsOverride(tokens, mode),
  };
}

/** Legacy export: tema chiaro di default (compatibilità con App.tsx pre-refactor). */
export const theme: ThemeConfig = themeForMode('light');
export default theme;

export { LAYOUT };

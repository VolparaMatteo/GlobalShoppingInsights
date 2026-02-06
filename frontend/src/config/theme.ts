// ---------------------------------------------------------------------------
// Global Shopping Insights - Ant Design Theme Configuration
// ---------------------------------------------------------------------------
// Uses the Ant Design v5 token-based theming system.
// See: https://ant.design/docs/react/customize-theme
// ---------------------------------------------------------------------------

import type { ThemeConfig } from 'antd';

const theme: ThemeConfig = {
  token: {
    // -- Brand colours ------------------------------------------------------
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',

    // -- Typography ---------------------------------------------------------
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,

    // -- Border radius ------------------------------------------------------
    borderRadius: 6,

    // -- Layout -------------------------------------------------------------
    colorBgLayout: '#f5f5f5',
    colorBgContainer: '#ffffff',

    // -- Misc ---------------------------------------------------------------
    wireframe: false,
  },

  components: {
    Layout: {
      headerBg: '#001529',
      siderBg: '#001529',
      bodyBg: '#f5f5f5',
    },
    Menu: {
      darkItemBg: '#001529',
      darkSubMenuItemBg: '#000c17',
    },
    Table: {
      headerBg: '#fafafa',
    },
    Card: {
      paddingLG: 20,
    },
  },
};

export { theme };
export default theme;

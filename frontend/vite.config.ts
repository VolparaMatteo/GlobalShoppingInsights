import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// Bundle analyzer attivato con: `ANALYZE=true npm run build`
// Produce dist/bundle-stats.html (treemap interattiva).
const enableAnalyzer = process.env.ANALYZE === 'true';

export default defineConfig({
  plugins: [
    react(),
    ...(enableAnalyzer
      ? [
          visualizer({
            filename: 'dist/bundle-stats.html',
            gzipSize: true,
            brotliSize: true,
            template: 'treemap', // 'treemap' | 'sunburst' | 'network'
            open: true,
          }),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Sourcemap abilitata per Sentry symbolication + debugging post-deploy.
    // Produce file .map separati (non inline) → non aumentano il bundle servito.
    sourcemap: true,
    // Chunk splitting esplicito per caching piu' efficace.
    rollupOptions: {
      output: {
        manualChunks: {
          // Libreria UI (cache separata, cambia raramente)
          antd: ['antd', '@ant-design/icons'],
          // React + router + query (core runtime)
          react: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
          // Utility pesanti
          editor: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          sanitize: ['dompurify'],
        },
      },
    },
    // Warning size chunk → 600 KB (default 500 KB e' stretto con antd).
    chunkSizeWarningLimit: 600,
  },
  server: {
    port: 5173,
    // File watching via polling — necessario su Docker + bind mount Windows:
    // il kernel Linux nel container non riceve inotify events dal filesystem
    // host NTFS/WSL2. Senza questo, Vite non vede le modifiche → HMR morto.
    // Interval 300ms (compromesso reattività/CPU). In dev nativo (non Docker)
    // puoi rimuovere — polling ha costo CPU rispetto a inotify.
    watch: {
      usePolling: true,
      interval: 300,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});

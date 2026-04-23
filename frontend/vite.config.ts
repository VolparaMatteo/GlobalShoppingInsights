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
    // NOTA: manualChunks in forma oggetto causava un race condition in produzione
    // ("Cannot read properties of undefined (reading '__SECRET_INTERNALS...')"):
    // react-dom si caricava prima che il chunk react fosse inizializzato a causa
    // dell'ordine modulepreload → parse del tag script principale. Lasciamo che
    // Vite/Rollup auto-chunking decida il grafo dipendenze — più robusto.
    // Se servira' un caching piu' granulare, usare la forma functional di
    // manualChunks con regole esplicite sugli id (e testare in prod!).
    rollupOptions: {},
    // Warning size chunk → 1200 KB (antd+ react + react-dom + tanstack insieme).
    chunkSizeWarningLimit: 1200,
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
      // BACKEND_URL letta da docker-compose.yml env (http://backend:8000)
      // quando giriamo in container — altrimenti fallback a localhost:8000
      // per chi lancia `npm run dev` nativo.
      '/api': {
        target: process.env.BACKEND_URL ?? 'http://localhost:8000',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.BACKEND_URL ?? 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});

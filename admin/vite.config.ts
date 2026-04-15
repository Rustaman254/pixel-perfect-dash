import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ripplify/shared': path.resolve(__dirname, '../packages/shared/src'),
    },
  },
  server: {
    port: 8083,
    host: '127.0.0.1',
    proxy: {
      '/api/auth': { target: 'http://localhost:3006', changeOrigin: true },
      '/sso.html': { target: 'http://localhost:3006', changeOrigin: true },
      '/api/admin/ripplify': { target: 'http://localhost:3010', changeOrigin: true },
      '/api/admin/watchtower': { target: 'http://localhost:3010', changeOrigin: true },
      '/api/admin/shopalize': { target: 'http://localhost:3010', changeOrigin: true },
      '/api/admin/agent': { target: 'http://localhost:3001', changeOrigin: true },
      '/api': { target: 'http://localhost:3006', changeOrigin: true },
    },
  },
  preview: {
    allowedHosts: ['admin.sokostack.xyz', 'sokostack.xyz', 'sokostack.ddns.net'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

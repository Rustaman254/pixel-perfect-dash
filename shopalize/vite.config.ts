import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: "::",
    port: 8081,
    proxy: {
      "/api/auth": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/sso.html": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/api/shopalize": {
        target: "http://localhost:3003",
        changeOrigin: true,
      },
      "/api/dns": {
        target: "http://localhost:3004",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  preview: {
    allowedHosts: ['shopalize.sokostack.xyz', 'sokostack.xyz', 'sokostack.ddns.net'],
  },
})

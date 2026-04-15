import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8082,
    allowedHosts: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      "/api/forms": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/api/auth": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/api/links": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/api/agent": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/api/": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
      "/auth": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
        rewrite: (path) => '/api' + path,
      },
      "/sso.html": {
        target: "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

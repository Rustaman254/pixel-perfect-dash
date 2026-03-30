import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: true,
    hmr: {
      overlay: true,
    },
    proxy: {
      "/api/auth": {
        target: "http://localhost:3006",
        changeOrigin: true,
      },
      "/api/oauth": {
        target: "http://localhost:3006",
        changeOrigin: true,
      },
      "/sso.html": {
        target: "http://localhost:3006",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:3007",
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

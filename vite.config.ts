import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  build: {
    outDir: "dist/spa",
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
      external: [
        '@rollup/rollup-linux-x64-gnu'
      ],
    },
  },
  plugins: [react(), mode === 'serve' ? expressPlugin() : null].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    configureServer(server) {
      // Dynamic import to avoid issues during build
      import("./server").then(({ createServer }) => {
        const app = createServer();
        server.middlewares.use(app);
      }).catch(console.error);
    },
  };
}

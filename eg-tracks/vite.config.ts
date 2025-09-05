import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import nodePolyfills from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          d3: ['d3'],
          gmod: ['@gmod/bam', '@gmod/bbi', '@gmod/tabix', '@gmod/twobit', '@gmod/vcf'],
          pixi: ['pixi.js'],
          utils: ['lodash', 'axios', 'jquery'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'd3', 'pixi.js', 'lodash'],
    exclude: ['@gmod/bam', '@gmod/bbi'],
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
});

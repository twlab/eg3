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
});

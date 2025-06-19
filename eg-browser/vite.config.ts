import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

import tailwindcss from "@tailwindcss/vite";

import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [react(), nodePolyfills(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/browser/",
});

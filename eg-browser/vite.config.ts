import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import nodePolyfills from "vite-plugin-node-polyfills";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: {
    // Give worker chunks the same Node polyfills that @gmod/* libs need
    plugins: () => [nodePolyfills({ protocolImports: true })],
  },
  define: {
    global: "globalThis",
    "process.env": "{}",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/browser/",
});

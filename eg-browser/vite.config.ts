import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
  customLogger: {
    ...({} as any),
    info: (msg, options) => {
      if (msg.includes("[vite] hot updated")) return;
      console.info(msg, options);
    },
    warn: console.warn,
    warnOnce: console.warn,
    error: console.error,
    clearScreen: () => { },
    hasErrorLogged: () => false,
    hasWarned: false,
  },
});

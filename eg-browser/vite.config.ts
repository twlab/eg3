import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dts from "vite-plugin-dts";

import tailwindcss from "@tailwindcss/vite";
import url from "@rollup/plugin-url";
import { nodePolyfills } from "vite-plugin-node-polyfills";
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },

  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "browser",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom"],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    url(),
    react(),
    nodePolyfills(),
    dts({
      outputDir: "dist",
      entryRoot: "src",
    }),
  ],
  base: "/browser/",
});

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dts from "vite-plugin-dts";
import { fileURLToPath } from "url";
import url from "@rollup/plugin-url";
import { nodePolyfills } from "vite-plugin-node-polyfills";
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  define: {
    "process.env": {},
  },
  server: {
    fs: {
      allow: [fileURLToPath(new URL(".", import.meta.url))],
    },
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "GenBrowser",
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
    url(),
    react(),
    nodePolyfills(),
    dts({
      outputDir: "dist",
      entryRoot: "src",
    }),
  ],
});

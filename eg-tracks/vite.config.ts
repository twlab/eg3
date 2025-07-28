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

  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "GenBrowser",
      fileName: (format) => `index.${format}.js`,
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        globals: {
          "react-dom": "ReactDom",
          react: "React",
          "react/jsx-runtime": "ReactJsxRuntime",
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

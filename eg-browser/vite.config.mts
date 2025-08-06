import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import url from "@rollup/plugin-url";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    url(),
    react(),
    tailwindcss(),
    dts({
      outputDir: "dist",
      entryRoot: "src",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
    "process.env": "{}",
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "wuepgg3",
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
});

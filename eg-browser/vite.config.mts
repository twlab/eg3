import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import url from "@rollup/plugin-url";
import tailwindcss from "@tailwindcss/vite";
import dts from "vite-plugin-dts";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig({
  plugins: [
    url(),
    react(),
    nodePolyfills(),
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
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "wuepgg3",
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

  base: "/browser/",
});

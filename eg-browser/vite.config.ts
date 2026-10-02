import { defineConfig, type Plugin, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import dts from "vite-plugin-dts";

import tailwindcss from "@tailwindcss/vite";

const buildVersion = Date.now().toString();

// Emits version.json into the build output so deployed clients can poll it
// and detect when a newer build has been published.
function versionFile(): Plugin {
  return {
    name: "emit-version-file",
    apply: "build",
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: JSON.stringify({ version: buildVersion }),
      });
    },
  };
}

const alias = {
  "@": path.resolve(__dirname, "./src"),
};

// Hosted website: `vite` / `vite build` (deployed to epigenomegateway.org/browser/).
const appConfig: UserConfig = {
  plugins: [react(), tailwindcss(), versionFile()],
  define: {
    global: "globalThis",
    "process.env": "{}",
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  resolve: { alias },
  base: "/browser/",
};

// npm package: `vite build --mode lib`. Bundles eg-tracks (wuepgg3-track) into
// the output so consumers install a single package. Output goes to dist-lib/
// so it never mixes with the website build in dist/.
const libConfig: UserConfig = {
  plugins: [
    react(),
    tailwindcss(),
    dts({
      tsconfigPath: "./tsconfig.lib.json",
      // eg-tracks sources live outside eg-browser, so the declaration root is
      // the monorepo root; insertTypesEntry adds dist-lib/index.d.ts on top.
      entryRoot: "..",
      outDir: "dist-lib",
      insertTypesEntry: true,
    }),
  ],
  define: {
    global: "globalThis",
    // Lib mode leaves process.env.NODE_ENV for the consumer, but bundled deps
    // would then see `{}.NODE_ENV` and run their dev-only code paths.
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  resolve: { alias },
  // The website's public/ folder (3Dmol, example files, logos) is not shipped.
  publicDir: false,
  build: {
    outDir: "dist-lib",
    // Inline imported assets so they work regardless of how the consumer
    // serves files.
    assetsInlineLimit: 1024 * 1024,
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "wuepgg",
      fileName: (format) => (format === "es" ? "index.es.js" : `index.${format}.cjs`),
    },
    rollupOptions: {
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/],
      output: {
        globals: {
          react: "React",
          "react-dom": "ReactDOM",
          "react-dom/client": "ReactDOM",
          "react/jsx-runtime": "ReactJsxRuntime",
        },
      },
    },
  },
};

export default defineConfig(({ mode }) =>
  mode === "lib" ? libConfig : appConfig,
);

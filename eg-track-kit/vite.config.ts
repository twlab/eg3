import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { writeFileSync } from "fs";
import dts from "vite-plugin-dts";

/* Each entry is its own import path, so a page that only draws pulls in no
   fetching, and one that fetches on a worker pulls the fetching in only
   there. Code the entries share lands in shared chunks, loaded once. */
const entries = {
  index: "src/index.ts",
  draw: "src/draw.ts",
  fetch: "src/fetch.ts",
  "fetch-local": "src/fetch-local.ts",
  workers: "src/workers.ts",
};

/* `npm run report`: which source files each built file carries, to check
   that none of the browser around the tracks came along. */
function moduleReport(): Plugin {
  return {
    name: "module-report",
    apply: "build",
    generateBundle(_options, bundle) {
      const report: Record<string, { bytes: number; modules: string[] }> = {};
      for (const [name, file] of Object.entries(bundle)) {
        if (file.type !== "chunk") continue;
        report[name] = {
          bytes: file.code.length,
          modules: Object.keys(file.modules).map((id) =>
            path.relative(path.resolve(__dirname, ".."), id).replace(/\\/g, "/"),
          ),
        };
      }
      /* How each unwanted module was reached: its importers back to one of
         this package's own files. */
      const unwanted = /allGenomes|flexlayout-react\/lib\/index\.js$|config-menu-components|genomeNavigator|pixi\.js\/lib\/index/;
      const chains: Record<string, string[]> = {};
      const short = (id: string) =>
        path.relative(path.resolve(__dirname, ".."), id).replace(/\\/g, "/");
      for (const id of this.getModuleIds()) {
        if (!unwanted.test(id) || id.includes("?")) continue;
        const chain = [short(id)];
        const seen = new Set([id]);
        let at = id;
        while (!at.includes("eg-track-kit/src") && !at.includes("eg-track-kit\\src")) {
          const next = this.getModuleInfo(at)?.importers.find((i) => !seen.has(i));
          if (!next) break;
          seen.add(next);
          chain.push(short(next));
          at = next;
        }
        chains[short(id)] = chain;
      }
      writeFileSync(
        path.resolve(__dirname, "modules.json"),
        JSON.stringify({ chunks: report, chains }, null, 2),
      );
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    dts({
      tsconfigPath: "./tsconfig.json",
      // The tracks' sources live in eg-tracks, outside this package, so the
      // declarations are rooted at the monorepo.
      entryRoot: "..",
      outDir: "dist",
      /* Their declarations come along, so the types this package exports
         resolve; the browser around them is left out. */
      include: ["src", "../eg-tracks/src"],
      exclude: [
        "../eg-tracks/src/genome-hub/**",
        "../eg-tracks/src/track-container/**",
        "../eg-tracks/src/components/index.tsx",
        "../eg-tracks/src/index.ts",
      ],
    }),
    ...(mode === "report" ? [moduleReport()] : []),
  ],
  define: {
    global: "globalThis",
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env": "{}",
  },
  publicDir: false,
  build: {
    outDir: "dist",
    assetsInlineLimit: 1024 * 1024,
    lib: {
      entry: Object.fromEntries(
        Object.entries(entries).map(([name, file]) => [
          name,
          path.resolve(__dirname, file),
        ]),
      ),
      formats: ["es"],
      fileName: (_format, name) => `${name}.js`,
    },
    rollupOptions: {
      external: [/^react(\/.*)?$/, /^react-dom(\/.*)?$/],
      output: {
        assetFileNames: (asset) =>
          asset.name?.endsWith(".css") ? "style.css" : "assets/[name]-[hash][extname]",
      },
    },
  },
  worker: {
    format: "es",
  },
}));

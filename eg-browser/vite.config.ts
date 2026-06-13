import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

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

export default defineConfig({
  plugins: [react(), tailwindcss(), versionFile()],
  define: {
    global: "globalThis",
    "process.env": "{}",
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: "/browser/",
});

import path from "path";
import { defineConfig } from "vitest/config";

// Unit tests for the pure model code. Kept separate from vite.config.ts so the
// tests don't load the browser build plugins.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});

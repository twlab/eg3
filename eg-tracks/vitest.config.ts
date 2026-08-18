import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // The pre-existing tests were written against Jest globals, so keep
    // describe/it/expect available without an import in every file.
    globals: true,
    environment: "node",
    include: ["src/**/*.{test,spec}.{js,ts,tsx}"],
    // Rendering-level code needs a browser and belongs in the Playwright suite;
    // this project runs pure model/util logic only.
    exclude: ["node_modules/**", "dist/**"],
  },
});

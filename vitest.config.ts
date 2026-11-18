import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // PGlite boots a WASM Postgres per test file; give it room on slow machines.
    testTimeout: 30_000,
    hookTimeout: 60_000,
    alias: {
      // `server-only` throws outside a React Server environment; tests run server code directly.
      "server-only": new URL("./tests/support/server-only-stub.ts", import.meta.url).pathname,
    },
  },
});

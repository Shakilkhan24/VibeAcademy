import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Architectural boundaries (see docs/architecture.md):
 *   src/domain     pure logic. No React, no Next, no server code, no I/O.
 *   src/server     server-only: database, AI gateway, services.
 *   src/content    server-only loaders for /content YAML.
 *   src/components UI. Never imports server code.
 *   src/app        routes. The only layer allowed to wire server + UI together.
 */
const config = [
  ...nextVitals,
  ...nextTs,
  {
    ignores: [".next/**", "node_modules/**", "drizzle/**", "next-env.d.ts", "lab/k6/**", "test-results/**", "playwright-report/**"],
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": ["warn", { allow: ["warn", "error", "info"] }],
    },
  },
  {
    files: ["src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/server/*", "@/server", "@/app/*", "@/components/*", "@/content/*"], message: "src/domain must stay pure: no server, UI or content imports." },
            { group: ["react", "react-dom", "next", "next/*", "node:*", "fs", "path"], message: "src/domain must not depend on React, Next.js or Node APIs." },
          ],
        },
      ],
    },
  },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/server/*", "@/server", "@/content/*"], message: "Components must not import server code. Pass data in as props from a route." },
          ],
        },
      ],
    },
  },
];

export default config;

import { randomBytes } from "node:crypto";
import { defineConfig } from "@playwright/test";

const localPort = 3170;
const baseURL = process.env.BASE_URL || `http://127.0.0.1:${localPort}`;

export default defineConfig({
  testDir: "./tests/browser",
  workers: 2,
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: { baseURL, browserName: "chromium", trace: "retain-on-failure" },
  projects: [
    { name: "390px", use: { viewport: { width: 390, height: 844 } } },
    { name: "1280px", use: { viewport: { width: 1280, height: 800 } } },
  ],
  webServer: process.env.BASE_URL ? undefined : {
    command: `pnpm exec next start -H 127.0.0.1 -p ${localPort}`,
    wait: { stdout: /Ready in/ },
    env: {
      DATABASE_URL: "",
      PGLITE_DATA_DIR: "memory://",
      HASH_SECRET: randomBytes(32).toString("hex"),
      AI_PROVIDER: "rules",
      NEXT_PUBLIC_SITE_URL: baseURL,
      NODE_ENV: "production",
    },
  },
});

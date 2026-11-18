import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: [
    {
      command: "node tests/mocks/bcb-mock-server.mjs",
      url: "http://127.0.0.1:4100/__health",
      reuseExistingServer: false,
      timeout: 15000,
    },
    {
      command:
        "node -e \"const fs=require('fs'),{execSync}=require('child_process');if(!fs.existsSync('.next/BUILD_ID'))execSync('npm run build',{stdio:'inherit'})\" && npx next start -p 3100 -H 127.0.0.1",
      url: "http://127.0.0.1:3100",
      env: {
        BCB_API_BASE_URL: "http://127.0.0.1:4100",
      },
      reuseExistingServer: false,
      timeout: 120000,
    },
  ],
});

import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: [
        "src/features/**/*.{ts,tsx}",
        "src/config/**/*.ts",
        "src/lib/**/*.ts",
        "src/services/**/*.ts",
        "src/app/api/**/*.ts",
        "src/components/layout/sidebar-nav.tsx",
        "src/components/layout/site-header.tsx",
        "src/components/layout/tool-page-header.tsx",
      ],
      exclude: ["src/**/*.test.{ts,tsx}", "src/**/*.d.ts"],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});

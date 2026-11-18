import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const ROOT_DIR = process.cwd();
const APP_DIR = path.join(ROOT_DIR, "src", "app");
const REGISTRY_PATH = path.join(ROOT_DIR, "src", "config", "tools-registry.ts");
const E2E_DIR = path.join(ROOT_DIR, "tests", "e2e");
const LAYOUT_SPEC_PATH = path.join(E2E_DIR, "layout-and-snapshots.spec.ts");
const SCREENSHOTS_DIR = path.join(E2E_DIR, "__screenshots__");

/**
 * Recursively discovers all Next.js App Router page routes under src/app.
 */
function discoverAppRoutes(dir, segments = []) {
  if (!fs.existsSync(dir)) return [];

  const routes = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Ignore Next.js route group parentheses in URL path
      const nextSegments =
        entry.name.startsWith("(") && entry.name.endsWith(")")
          ? segments
          : [...segments, entry.name];
      routes.push(...discoverAppRoutes(fullPath, nextSegments));
    } else if (entry.isFile() && entry.name === "page.tsx") {
      const routePath = segments.length === 0 ? "/" : `/${segments.join("/")}`;
      routes.push(routePath);
    }
  }

  return routes.sort();
}

/**
 * Loads TOOLS_REGISTRY from src/config/tools-registry.ts using TypeScript transpile.
 */
function loadReadyTools() {
  const source = fs.readFileSync(REGISTRY_PATH, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });

  const moduleObj = { exports: {} };
  const context = vm.createContext({
    module: moduleObj,
    exports: moduleObj.exports,
  });
  vm.runInContext(outputText, context);

  const registry = moduleObj.exports.TOOLS_REGISTRY ?? [];
  return registry.filter((tool) => tool.status === "ready");
}

/**
 * Extracts { path, name } route entries from layout-and-snapshots.spec.ts.
 */
function parseLayoutRoutes(content) {
  const map = new Map();
  const objectEntryRegex =
    /\{\s*path\s*:\s*["'`]([^"'`]+)["'`]\s*,\s*name\s*:\s*["'`]([^"'`]+)["'`]\s*\}/g;

  for (const match of content.matchAll(objectEntryRegex)) {
    map.set(match[1], match[2]);
  }

  return map;
}

function hasQuotedString(content, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`["'\`]${escaped}(?:\\?[^"'\`]*)?["'\`]`);
  return regex.test(content);
}

function main() {
  const errors = [];

  const appRoutes = discoverAppRoutes(APP_DIR);
  const appRouteSet = new Set(appRoutes);
  const readyTools = loadReadyTools();

  const allRequiredRoutes = new Set(appRoutes);
  for (const tool of readyTools) {
    const baseRoute = tool.href.split("?")[0] || "/";
    allRequiredRoutes.add(baseRoute);
    if (!appRouteSet.has(baseRoute)) {
      errors.push(
        `Ready tool "${tool.id}" points to "${tool.href}", but no page.tsx exists for "${baseRoute}".`
      );
    }
  }

  const sortedRequiredRoutes = Array.from(allRequiredRoutes).sort();

  // 1. Verify layout & snapshot coverage in layout-and-snapshots.spec.ts
  if (!fs.existsSync(LAYOUT_SPEC_PATH)) {
    errors.push(
      `Missing layout & snapshot E2E spec: tests/e2e/layout-and-snapshots.spec.ts`
    );
  } else {
    const layoutSpecContent = fs.readFileSync(LAYOUT_SPEC_PATH, "utf8");
    const registeredRoutes = parseLayoutRoutes(layoutSpecContent);

    if (!layoutSpecContent.includes("toHaveScreenshot")) {
      errors.push(
        `tests/e2e/layout-and-snapshots.spec.ts must include toHaveScreenshot(...) visual snapshot assertions.`
      );
    }

    for (const route of sortedRequiredRoutes) {
      const snapshotName = registeredRoutes.get(route);
      if (!snapshotName) {
        errors.push(
          `Route "${route}" is missing from ROUTES in tests/e2e/layout-and-snapshots.spec.ts (layout & bounding-box + snapshot checks).`
        );
        continue;
      }

      const desktopSnapshot = path.join(
        SCREENSHOTS_DIR,
        "desktop",
        `${snapshotName}.png`
      );
      const mobileSnapshot = path.join(
        SCREENSHOTS_DIR,
        "mobile",
        `${snapshotName}.png`
      );

      if (!fs.existsSync(desktopSnapshot)) {
        errors.push(
          `Missing Desktop (1440x900) snapshot for route "${route}": tests/e2e/__screenshots__/desktop/${snapshotName}.png`
        );
      }
      if (!fs.existsSync(mobileSnapshot)) {
        errors.push(
          `Missing Mobile (375x667) snapshot for route "${route}": tests/e2e/__screenshots__/mobile/${snapshotName}.png`
        );
      }
    }
  }

  // 2. Verify interactive functional E2E scenarios
  const e2eFiles = fs.existsSync(E2E_DIR)
    ? fs
        .readdirSync(E2E_DIR)
        .filter(
          (file) =>
            file.endsWith(".spec.ts") && file !== "layout-and-snapshots.spec.ts"
        )
    : [];

  if (e2eFiles.length === 0) {
    errors.push(
      `Missing functional E2E test file in tests/e2e/ (expected functional-scenarios.spec.ts or e2e-coverage.spec.ts).`
    );
    for (const route of sortedRequiredRoutes) {
      errors.push(
        `Route "${route}" is missing interactive functional E2E scenarios.`
      );
    }
  } else {
    const functionalContent = e2eFiles
      .map((file) => fs.readFileSync(path.join(E2E_DIR, file), "utf8"))
      .join("\n");

    for (const route of sortedRequiredRoutes) {
      if (!hasQuotedString(functionalContent, route)) {
        errors.push(
          `Route "${route}" is missing interactive functional E2E scenarios in tests/e2e/${e2eFiles.join(", ")}.`
        );
      }
    }

    for (const tool of readyTools) {
      const baseRoute = tool.href.split("?")[0] || "/";
      const queryPart = tool.href.includes("?") ? tool.href.split("?")[1] : "";
      const hasBaseRoute = hasQuotedString(functionalContent, baseRoute);

      if (!hasBaseRoute) {
        errors.push(
          `Ready tool "${tool.id}" (${tool.href}) is not covered by functional E2E tests.`
        );
        continue;
      }

      if (queryPart) {
        const params = new URLSearchParams(queryPart);
        const tabValue = params.get("tab");
        const coversTool =
          functionalContent.includes(tool.href) ||
          functionalContent.includes(tool.id) ||
          (tabValue && new RegExp(tabValue, "i").test(functionalContent));

        if (!coversTool) {
          errors.push(
            `Ready tool "${tool.id}" (${tool.href}) has no matching functional E2E scenario (expected reference to "${tool.href}", "${tool.id}", or "${tabValue}").`
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    console.error("❌ E2E Route Coverage Gate FAILED:\n");
    for (const err of errors) {
      console.error(`  - ${err}`);
    }
    console.error(
      "\nEvery page under src/app/**/page.tsx and every 'ready' tool in src/config/tools-registry.ts must have:\n" +
        "  1. Entry in tests/e2e/layout-and-snapshots.spec.ts + Desktop & Mobile snapshots\n" +
        "  2. Interactive functional E2E scenarios in tests/e2e/functional-scenarios.spec.ts"
    );
    process.exit(1);
  }

  console.log(
    `✅ E2E Route Coverage Gate passed: ${sortedRequiredRoutes.length} routes and ${readyTools.length} ready tools covered (layout, snapshots, functional E2E).`
  );
}

main();

import { describe, expect, it } from "vitest";
import {
  getPriorityTools,
  getToolsByCategory,
  TOOL_CATEGORIES,
  TOOLS_REGISTRY,
  type ToolCategory,
} from "./tools-registry";

describe("tools-registry", () => {
  it("defines all four expected tool categories with labels and descriptions", () => {
    const categoryIds = TOOL_CATEGORIES.map((category) => category.id);
    expect(categoryIds).toEqual([
      "geradores",
      "calculadoras",
      "validadores",
      "utilitarios",
    ]);

    for (const category of TOOL_CATEGORIES) {
      expect(category.label.trim().length).toBeGreaterThan(0);
      expect(category.shortLabel.trim().length).toBeGreaterThan(0);
      expect(category.description.trim().length).toBeGreaterThan(0);
    }
  });

  it("contains valid, unique tool definitions across the registry", () => {
    expect(TOOLS_REGISTRY.length).toBeGreaterThan(0);

    const ids = new Set<string>();
    const slugs = new Set<string>();
    const validCategories = new Set<ToolCategory>(
      TOOL_CATEGORIES.map((category) => category.id)
    );

    for (const tool of TOOLS_REGISTRY) {
      expect(ids.has(tool.id)).toBe(false);
      expect(slugs.has(tool.slug)).toBe(false);
      ids.add(tool.id);
      slugs.add(tool.slug);

      expect(validCategories.has(tool.category)).toBe(true);
      expect(["ready", "coming-soon"]).toContain(tool.status);
      expect(tool.href.startsWith("/")).toBe(true);
      expect(tool.name.trim().length).toBeGreaterThan(0);
      expect(tool.shortName.trim().length).toBeGreaterThan(0);
      expect(tool.description.trim().length).toBeGreaterThan(0);
      expect(tool.keywords.length).toBeGreaterThan(0);
    }
  });

  it("marks the core MVP tools as ready", () => {
    const readyIds = TOOLS_REGISTRY.filter((tool) => tool.status === "ready").map(
      (tool) => tool.id
    );
    expect(readyIds).toEqual(
      expect.arrayContaining([
        "gerador-de-cpf",
        "gerador-de-cnpj",
        "calculadora-juros-compostos",
        "validador-de-cpf",
        "validador-de-cnpj",
      ])
    );
  });

  it("getPriorityTools returns only tools flagged with priority", () => {
    const priorityTools = getPriorityTools();
    expect(priorityTools.length).toBeGreaterThan(0);
    expect(priorityTools.every((tool) => tool.priority === true)).toBe(true);
    expect(priorityTools.map((tool) => tool.id)).toEqual(
      expect.arrayContaining([
        "gerador-de-cpf",
        "gerador-de-cnpj",
        "calculadora-juros-compostos",
      ])
    );
  });

  it("getToolsByCategory partitions tools cleanly by category", () => {
    let totalByCategory = 0;

    for (const category of TOOL_CATEGORIES) {
      const tools = getToolsByCategory(category.id);
      expect(tools.length).toBeGreaterThan(0);
      expect(tools.every((tool) => tool.category === category.id)).toBe(true);
      totalByCategory += tools.length;
    }

    expect(totalByCategory).toBe(TOOLS_REGISTRY.length);
  });
});

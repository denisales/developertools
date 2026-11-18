import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("combines simple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional, falsy, array, and object inputs", () => {
    const isActive = true;
    const isDisabled = false;
    expect(
      cn(
        "base",
        isActive && "active",
        isDisabled && "disabled",
        null,
        undefined,
        ["nested", { hidden: false, block: true }]
      )
    ).toBe("base active nested block");
  });

  it("merges conflicting Tailwind utility classes keeping the last one", () => {
    expect(cn("px-2 py-1 text-sm", "px-4 text-lg")).toBe("py-1 px-4 text-lg");
    expect(cn("bg-red-500", "bg-blue-600")).toBe("bg-blue-600");
  });

  it("returns empty string when called with no arguments", () => {
    expect(cn()).toBe("");
  });
});

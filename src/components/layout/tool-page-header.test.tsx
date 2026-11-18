import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToolPageHeader } from "./tool-page-header";

describe("ToolPageHeader", () => {
  it("renders title, description, icon, and default iconClassName", () => {
    render(
      <ToolPageHeader
        icon={<span data-testid="tool-icon">Icon</span>}
        title="Gerador de CPF"
        description="Gere CPFs válidos para testes."
      />
    );

    const heading = screen.getByRole("heading", { level: 1, name: "Gerador de CPF" });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("truncate", "text-lg", "sm:text-2xl", "font-bold");

    const description = screen.getByText("Gere CPFs válidos para testes.");
    expect(description).toHaveClass("text-xs", "sm:text-sm", "line-clamp-1", "sm:line-clamp-none");

    const iconWrapper = screen.getByTestId("tool-icon").parentElement;
    expect(iconWrapper).toHaveClass("bg-primary/10", "text-primary", "size-9", "sm:size-10", "rounded-xl");
  });

  it("applies custom iconClassName and renders optional actions", () => {
    render(
      <ToolPageHeader
        icon={<span data-testid="custom-icon">Calc</span>}
        iconClassName="bg-emerald-500/10 text-emerald-600"
        title="Calculadora de Juros Compostos"
        description="Simule rendimentos mensais."
        actions={<button type="button">Restaurar</button>}
      />
    );

    const iconWrapper = screen.getByTestId("custom-icon").parentElement;
    expect(iconWrapper).toHaveClass("bg-emerald-500/10", "text-emerald-600");
    expect(iconWrapper).not.toHaveClass("bg-primary/10");

    const actionButton = screen.getByRole("button", { name: "Restaurar" });
    expect(actionButton).toBeInTheDocument();
    expect(actionButton.parentElement).toHaveClass("flex", "shrink-0", "items-center", "gap-2");
  });

  it("renders responsive mobileTitle alongside desktop title when provided", () => {
    render(
      <ToolPageHeader
        icon={<span>Icon</span>}
        title="Calculadora de Juros Compostos"
        mobileTitle="Juros Compostos"
        description="Descrição detalhada."
      />
    );

    const mobileSpan = screen.getByText("Juros Compostos");
    const desktopSpan = screen.getByText("Calculadora de Juros Compostos");

    expect(mobileSpan).toHaveClass("sm:hidden");
    expect(desktopSpan).toHaveClass("hidden", "sm:inline");
    expect(mobileSpan.closest("h1")).toBe(desktopSpan.closest("h1"));
  });
});

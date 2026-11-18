import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TOOL_CATEGORIES } from "@/config/tools-registry";
import { SidebarNav } from "./sidebar-nav";

const usePathnameMock = vi.fn<() => string>(() => "/");

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

describe("SidebarNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePathnameMock.mockReturnValue("/");
  });

  it("expands all 4 category accordions and renders tool links when defaultExpanded is true (Desktop)", () => {
    render(<SidebarNav defaultExpanded />);

    for (const category of TOOL_CATEGORIES) {
      const trigger = screen.getByRole("button", {
        name: new RegExp(category.shortLabel, "i"),
      });
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    }

    expect(screen.getAllByText("Breve").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Validador de CNPJ/i })).toBeInTheDocument();
  });

  it("collapses all 4 category accordions by default when defaultExpanded is false (Mobile) and expands on click", () => {
    render(<SidebarNav defaultExpanded={false} />);

    for (const category of TOOL_CATEGORIES) {
      const trigger = screen.getByRole("button", {
        name: new RegExp(category.shortLabel, "i"),
      });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    }

    expect(screen.queryByRole("link", { name: /Validador de CNPJ/i })).not.toBeInTheDocument();

    const validadoresTrigger = screen.getByRole("button", {
      name: /Validadores/i,
    });
    fireEvent.click(validadoresTrigger);
    expect(validadoresTrigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: /Validador de CNPJ/i })).toBeInTheDocument();
  });

  it("defaults to collapsed when defaultExpanded is omitted and toggles open categories closed on click", () => {
    render(<SidebarNav />);

    const geradoresTrigger = screen.getByRole("button", {
      name: /Geradores/i,
    });
    expect(geradoresTrigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(geradoresTrigger);
    expect(geradoresTrigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(geradoresTrigger);
    expect(geradoresTrigger).toHaveAttribute("aria-expanded", "false");
  });

  it("highlights the active route and invokes onNavigate when a link is clicked", () => {
    usePathnameMock.mockReturnValue("/gerador-de-cpf");
    const onNavigate = vi.fn();

    render(<SidebarNav defaultExpanded onNavigate={onNavigate} />);

    const cpfLinks = screen.getAllByRole("link", { name: /Gerador de CPF/i });
    expect(cpfLinks.length).toBeGreaterThanOrEqual(2);
    expect(cpfLinks[0]).toHaveClass("bg-primary");
    expect(cpfLinks[1]).toHaveClass("bg-accent");

    fireEvent.click(cpfLinks[0]);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

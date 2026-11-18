import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TOOL_CATEGORIES } from "@/config/tools-registry";
import { SiteHeader } from "./site-header";

const usePathnameMock = vi.fn<() => string>(() => "/");
const pushMock = vi.fn<(href: string) => void>();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({
    push: pushMock,
  }),
}));

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

describe("SiteHeader", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    usePathnameMock.mockReturnValue("/");
    mockMatchMedia(false);
    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Theme persistence", () => {
    it("reads 'dark' from localStorage on mount and applies .dark on documentElement", () => {
      localStorage.setItem("theme", "dark");

      render(<SiteHeader />);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
      const toggleBtn = screen.getByRole("button", {
        name: /Alternar tema claro\/escuro/i,
      });
      expect(toggleBtn).toHaveAttribute("title", "Mudar para modo claro");
    });

    it("reads 'light' from localStorage on mount and removes .dark from documentElement", () => {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "light");

      render(<SiteHeader />);

      expect(document.documentElement.classList.contains("dark")).toBe(false);
      const toggleBtn = screen.getByRole("button", {
        name: /Alternar tema claro\/escuro/i,
      });
      expect(toggleBtn).toHaveAttribute("title", "Mudar para modo escuro");
    });

    it("falls back to prefers-color-scheme when localStorage has no theme", () => {
      mockMatchMedia(true);

      render(<SiteHeader />);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });

    it("toggles .dark and persists theme in localStorage when clicked", () => {
      render(<SiteHeader />);

      const toggleBtn = screen.getByRole("button", {
        name: /Alternar tema claro\/escuro/i,
      });
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      fireEvent.click(toggleBtn);
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(localStorage.getItem("theme")).toBe("dark");
      expect(toggleBtn).toHaveAttribute("title", "Mudar para modo claro");

      fireEvent.click(toggleBtn);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(localStorage.getItem("theme")).toBe("light");
      expect(toggleBtn).toHaveAttribute("title", "Mudar para modo escuro");
    });

    it("handles localStorage read/write errors gracefully", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("storage blocked");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("storage blocked");
      });

      render(<SiteHeader />);

      const toggleBtn = screen.getByRole("button", {
        name: /Alternar tema claro\/escuro/i,
      });
      fireEvent.click(toggleBtn);

      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("Mobile search overlay", () => {
    it("opens the full-width search overlay without duplicate x icons and handles clear/close/navigation", () => {
      vi.useFakeTimers();
      render(<SiteHeader />);

      const mobileSearchTrigger = screen.getByRole("button", {
        name: /Buscar ferramenta/i,
      });
      fireEvent.click(mobileSearchTrigger);

      act(() => {
        vi.advanceTimersByTime(50);
      });

      const dialog = screen.getByRole("dialog", {
        name: /Buscar ferramentas/i,
      });
      expect(dialog).toBeInTheDocument();

      // Only one X button inside the mobile search overlay (no duplicate x icons)
      const closeOrClearBtn = within(dialog).getByRole("button", {
        name: /Fechar busca/i,
      });
      expect(closeOrClearBtn.querySelectorAll("svg")).toHaveLength(1);
      expect(dialog.querySelectorAll("svg.lucide-x")).toHaveLength(1);

      const input = within(dialog).getByPlaceholderText(/Buscar CPF, CNPJ, Juros/i);
      expect(input).toHaveFocus();

      // Filter with non-matching text
      fireEvent.change(input, { target: { value: "zzzz-inexistente" } });
      expect(
        within(dialog).getByText(/Nenhuma ferramenta encontrada/i)
      ).toBeInTheDocument();

      // Clear button clears query while keeping dialog open
      const clearBtn = within(dialog).getByRole("button", {
        name: /Limpar busca/i,
      });
      fireEvent.click(clearBtn);
      expect(input).toHaveValue("");

      // Filter matching tool and select it
      fireEvent.change(input, { target: { value: "CPF" } });
      const cpfResult = within(dialog).getByRole("button", {
        name: /Gerador e Validador de CPF/i,
      });
      fireEvent.click(cpfResult);

      expect(pushMock).toHaveBeenCalledWith("/gerador-de-cpf");
      expect(
        screen.queryByRole("dialog", { name: /Buscar ferramentas/i })
      ).not.toBeInTheDocument();

      // Re-open and close via X button when query is empty
      fireEvent.click(mobileSearchTrigger);
      const reopenedDialog = screen.getByRole("dialog", {
        name: /Buscar ferramentas/i,
      });
      fireEvent.click(
        within(reopenedDialog).getByRole("button", { name: /Fechar busca/i })
      );
      expect(
        screen.queryByRole("dialog", { name: /Buscar ferramentas/i })
      ).not.toBeInTheDocument();
    });

    it("closes mobile search overlay when clicking backdrop or pressing Escape", () => {
      render(<SiteHeader />);

      fireEvent.click(screen.getByRole("button", { name: /Buscar ferramenta/i }));
      expect(
        screen.getByRole("dialog", { name: /Buscar ferramentas/i })
      ).toBeInTheDocument();

      fireEvent.keyDown(window, { key: "Escape" });
      expect(
        screen.queryByRole("dialog", { name: /Buscar ferramentas/i })
      ).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Buscar ferramenta/i }));
      const dialog = screen.getByRole("dialog", { name: /Buscar ferramentas/i });
      const backdrop = dialog.previousElementSibling;
      expect(backdrop).not.toBeNull();
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      expect(
        screen.queryByRole("dialog", { name: /Buscar ferramentas/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Desktop search, shortcuts, breadcrumb and mobile drawer", () => {
    it("handles desktop search dropdown, clear button, selection, and blur", () => {
      vi.useFakeTimers();
      render(<SiteHeader />);

      const desktopInput = screen.getByPlaceholderText(
        /Buscar ferramenta \(CPF, CNPJ, Juros\)/i
      );

      // Cmd/Ctrl+K focuses desktop input when width >= 640
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      expect(desktopInput).toHaveFocus();

      fireEvent.focus(desktopInput);
      fireEvent.change(desktopInput, { target: { value: "zzzz-none" } });
      expect(
        screen.getByText(/Nenhuma ferramenta encontrada/i)
      ).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Limpar busca/i }));
      expect(desktopInput).toHaveValue("");

      fireEvent.change(desktopInput, { target: { value: "CNPJ" } });
      const cnpjOption = screen.getByRole("button", {
        name: /Gerador e Validador de CNPJ/i,
      });
      fireEvent.mouseDown(cnpjOption);
      expect(pushMock).toHaveBeenCalledWith("/gerador-de-cnpj");

      fireEvent.change(desktopInput, { target: { value: "CPF" } });
      fireEvent.focus(desktopInput);
      fireEvent.blur(desktopInput);
      act(() => {
        vi.advanceTimersByTime(200);
      });
      expect(
        screen.queryByRole("button", { name: /Gerador e Validador de CPF/i })
      ).not.toBeInTheDocument();
    });

    it("toggles mobile search with Cmd/Ctrl+K when viewport is narrow (< 640px)", () => {
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SiteHeader />);

      fireEvent.keyDown(window, { key: "k", metaKey: true });
      expect(
        screen.getByRole("dialog", { name: /Buscar ferramentas/i })
      ).toBeInTheDocument();
    });

    it("renders active tool breadcrumb and opens mobile Sheet with collapsed SidebarNav", () => {
      usePathnameMock.mockReturnValue("/gerador-de-cpf");
      render(<SiteHeader />);

      expect(screen.getByText("Geradores")).toBeInTheDocument();
      expect(screen.getByText("Gerador de CPF")).toBeInTheDocument();

      fireEvent.click(
        screen.getByRole("button", { name: /Abrir menu de ferramentas/i })
      );

      const sheetDialog = screen.getByRole("dialog");
      for (const category of TOOL_CATEGORIES) {
        const trigger = within(sheetDialog).getByRole("button", {
          name: new RegExp(category.shortLabel, "i"),
        });
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      }

      const overviewLink = within(sheetDialog).getByRole("link", {
        name: /Visão Geral/i,
      });
      fireEvent.click(overviewLink);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});

import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CnpjGeneratorFeature } from "./index";
import { validateCnpj } from "./cnpj-utils";

const { mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

function activateTab(name: string | RegExp) {
  const tab = screen.getByRole("tab", { name });
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab);
}

describe("CnpjGeneratorFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
        readText: vi.fn().mockResolvedValue(""),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders initial CNPJ state, copies with feedback timeout, and handles clipboard errors", async () => {
    render(<CnpjGeneratorFeature />);

    expect(
      screen.getByRole("heading", { name: "Gerador e Validador de CNPJ" })
    ).toBeInTheDocument();

    const heroButton = screen.getByTitle("Clique para copiar o CNPJ");
    expect(heroButton).toHaveTextContent("11.222.333/0001-81");
    expect(screen.getAllByText("Numérico").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Matriz (0001)").length).toBeGreaterThan(0);

    // Structural decomposition
    const structureCard = screen
      .getByText("Estrutura do CNPJ")
      .closest<HTMLElement>('[data-slot="card"]');
    expect(structureCard).toBeTruthy();
    if (structureCard) {
      expect(within(structureCard).getByText("11222333")).toBeInTheDocument();
      expect(within(structureCard).getByText("0001")).toBeInTheDocument();
      expect(within(structureCard).getByText("81")).toBeInTheDocument();
    }

    // Copy via hero button & timer reset
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(heroButton);
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "11.222.333/0001-81"
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "CNPJ copiado para a área de transferência!",
      { description: "11.222.333/0001-81" }
    );
    expect(screen.getByText("Copiado!")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("Copiar CNPJ")).toBeInTheDocument();
    vi.useRealTimers();

    // Copy error branch
    vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(
      new Error("Clipboard denied")
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copiar CNPJ" }));
    });
    expect(mockToastError).toHaveBeenCalledWith(
      "Não foi possível copiar automaticamente."
    );
  });

  it("generates new CNPJs, toggles numeric/alphanumeric, matriz/filial, punctuation, and manages history", async () => {
    render(<CnpjGeneratorFeature />);

    const heroButton = screen.getByTitle("Clique para copiar o CNPJ");

    // Generate a new numeric CNPJ
    fireEvent.click(screen.getByRole("button", { name: "Gerar Novo" }));
    const generatedNumeric = heroButton.textContent ?? "";
    expect(validateCnpj(generatedNumeric).isValid).toBe(true);
    expect(screen.getByText("Recentes nesta sessão")).toBeInTheDocument();

    // Switch to Alfanumérico
    fireEvent.click(screen.getByRole("button", { name: "Alfanumérico" }));
    const generatedAlpha = heroButton.textContent ?? "";
    expect(validateCnpj(generatedAlpha).isValid).toBe(true);
    expect(validateCnpj(generatedAlpha).mode).toBe("alphanumeric");

    // Switch to Filial
    fireEvent.click(screen.getByRole("button", { name: "Filial" }));
    const generatedFilial = heroButton.textContent ?? "";
    const filialResult = validateCnpj(generatedFilial);
    expect(filialResult.isValid).toBe(true);
    expect(filialResult.isHeadquarters).toBe(false);

    // Switch back to Matriz (0001) and Numérico
    fireEvent.click(screen.getByRole("button", { name: "Matriz (0001)" }));
    expect(
      validateCnpj(heroButton.textContent ?? "").isHeadquarters
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Numérico" }));
    expect(validateCnpj(heroButton.textContent ?? "").mode).toBe("numeric");

    // Toggle punctuation switch off -> 14 raw chars
    const punctuationSwitch = screen.getByRole("switch", {
      name: /Pontuação|XX\.XXX\.\.\./i,
    });
    fireEvent.click(punctuationSwitch);
    expect(heroButton.textContent ?? "").toMatch(/^\d{14}$/);

    // Copy a recent history item while unformatted
    const recentLabel = screen.getByText("Recentes nesta sessão");
    const recentSection = recentLabel.parentElement?.parentElement;
    expect(recentSection).toBeTruthy();
    if (recentSection) {
      const historyButtons = within(recentSection)
        .getAllByRole("button")
        .filter((btn) => btn.textContent !== "Limpar");
      expect(historyButtons.length).toBeGreaterThan(0);
      await act(async () => {
        fireEvent.click(historyButtons[0]);
      });
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        historyButtons[0].textContent ?? ""
      );
    }

    // Toggle punctuation back on
    fireEvent.click(punctuationSwitch);
    expect(heroButton.textContent ?? "").toMatch(
      /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/
    );

    // Clear recent history
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
    expect(
      screen.queryByText("Recentes nesta sessão")
    ).not.toBeInTheDocument();
  });

  it("navigates from generator quick Validar button into Validator tab and validates inputs", async () => {
    render(<CnpjGeneratorFeature />);

    // Quick inspect button inside hero card
    const heroCard = screen
      .getByTitle("Clique para copiar o CNPJ")
      .closest<HTMLElement>('[data-slot="card"]');
    expect(heroCard).toBeTruthy();
    if (heroCard) {
      fireEvent.click(within(heroCard).getByRole("button", { name: "Validar" }));
    }

    const validatorInput = screen.getByLabelText("CNPJ para validação");
    expect(validatorInput).toHaveValue("11.222.333/0001-81");
    expect(screen.getByText("CNPJ Válido!")).toBeInTheDocument();
    expect(screen.getByText("0001 (Matriz)")).toBeInTheDocument();

    // Copy formatted from validator
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Copiar Formatado" })
      );
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "11.222.333/0001-81"
    );

    // Click Alfanumérico Válido quick example
    fireEvent.click(
      screen.getByRole("button", { name: /Alfanumérico Válido/i })
    );
    expect(validatorInput).toHaveValue("12.ABC.345/01DE-35");
    expect(screen.getByText("CNPJ Válido!")).toBeInTheDocument();
    expect(screen.getByText("01DE (Filial)")).toBeInTheDocument();
    expect(
      screen.getByText("1º Dígito Verificador (DV1)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("2º Dígito Verificador (DV2)")
    ).toBeInTheDocument();

    // Click DV Inválido quick example
    fireEvent.click(screen.getByRole("button", { name: /DV Inválido/i }));
    expect(screen.getByText("CNPJ Inválido")).toBeInTheDocument();
    expect(
      screen.getByText(/Dígitos verificadores inválidos/)
    ).toBeInTheDocument();

    // Type repeated digits (14 chars, no steps)
    fireEvent.change(validatorInput, {
      target: { value: "11111111111111" },
    });
    expect(screen.getByText("CNPJ Inválido")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();

    // Type short value (< 14 chars)
    fireEvent.change(validatorInput, { target: { value: "12345" } });
    expect(screen.getByText("CNPJ Inválido")).toBeInTheDocument();
    expect(screen.getByText(/14 caracteres/)).toBeInTheDocument();

    // Type whitespace-only -> no validation banner
    fireEvent.change(validatorInput, { target: { value: "   " } });
    expect(screen.queryByText("CNPJ Inválido")).not.toBeInTheDocument();

    // Clear input
    fireEvent.click(screen.getByRole("button", { name: "Limpar" }));
    expect(validatorInput).toHaveValue("");
    expect(screen.queryByText("CNPJ Inválido")).not.toBeInTheDocument();
  });

  it("switches to Validator tab directly and shows default alphanumeric example breakdown", () => {
    render(<CnpjGeneratorFeature />);

    activateTab(/Validar/i);
    expect(screen.getByLabelText("CNPJ para validação")).toHaveValue(
      "12.ABC.345/01DE-35"
    );
    expect(screen.getByText("CNPJ Válido!")).toBeInTheDocument();
  });

  it("handles Em Lote tab: presets, input clamping, mode/punctuation toggles, random branch batch, copy & exports", async () => {
    const createObjectUrlMock = vi.fn().mockReturnValue("blob:mock-cnpj-url");
    const revokeObjectUrlMock = vi.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectUrlMock,
    });

    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<CnpjGeneratorFeature />);

    // First select Filial in generator tab so we also test random_branch batch path later
    fireEvent.click(screen.getByRole("button", { name: "Filial" }));

    // Switch to Em Lote tab
    activateTab(/Em Lote/i);

    expect(screen.getByText("Gerador de CNPJ em Lote")).toBeInTheDocument();
    expect(screen.getByText(/Total exibido:/)).toHaveTextContent(
      "Total exibido: 10 CNPJs"
    );

    // Export initial mixed batch (numeric Matriz + alphanumeric Filial) in CSV & JSON
    fireEvent.click(screen.getByRole("button", { name: ".CSV" }));
    fireEvent.click(screen.getByRole("button", { name: ".JSON" }));

    // Click preset 25
    fireEvent.click(screen.getByRole("button", { name: "25" }));
    expect(
      screen.getByRole("button", { name: "Gerar 25 CNPJs" })
    ).toBeInTheDocument();

    // Change quantity via input (clamping and normal)
    const countInput = screen.getByLabelText("Quantidade (1 a 100)");
    fireEvent.change(countInput, { target: { value: "250" } });
    expect(countInput).toHaveValue(100);
    fireEvent.change(countInput, { target: { value: "0" } });
    expect(countInput).toHaveValue(1);
    fireEvent.change(countInput, { target: { value: "5" } });
    expect(countInput).toHaveValue(5);

    // Generate batch in random_branch + alphanumeric mode
    fireEvent.click(screen.getByRole("button", { name: "Alfanumérico" }));
    fireEvent.click(screen.getByRole("button", { name: "Gerar 5 CNPJs" }));
    expect(screen.getByText(/Total exibido:/)).toHaveTextContent(
      "Total exibido: 5 CNPJs (Alfanumérico)"
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "5 CNPJs gerados com sucesso!"
    );

    // Trigger random_branch duplicate-handling termination when RNG is deterministic
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    fireEvent.click(screen.getByRole("button", { name: "Gerar 5 CNPJs" }));
    randomSpy.mockRestore();
    expect(screen.getByText(/Total exibido:/)).toHaveTextContent(
      "Total exibido: 1 CNPJs (Alfanumérico)"
    );

    // Switch back to numeric and Matriz on generator, then generate headquarters batch
    activateTab(/Gerar CNPJ/i);
    fireEvent.click(screen.getByRole("button", { name: "Matriz (0001)" }));
    activateTab(/Em Lote/i);
    fireEvent.click(screen.getByRole("button", { name: "Numérico" }));
    fireEvent.click(screen.getByRole("button", { name: "Gerar 5 CNPJs" }));
    expect(screen.getByText(/Total exibido:/)).toHaveTextContent(
      "Total exibido: 5 CNPJs (Numérico)"
    );

    // Toggle punctuation switch inside Em Lote tab
    expect(screen.getByText("Com máscara")).toBeInTheDocument();
    const batchSwitch = screen.getByRole("switch");
    fireEvent.click(batchSwitch);
    expect(screen.getByText("Sem máscara")).toBeInTheDocument();

    // Copy single batch item
    const singleCopyButtons = screen.getAllByTitle("Copiar CNPJ");
    await act(async () => {
      fireEvent.click(singleCopyButtons[0]);
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "CNPJ #1 copiado para a área de transferência!",
      expect.objectContaining({ description: expect.any(String) })
    );

    // Copy all batch items
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copiar Todos" }));
    });
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "5 CNPJs copiado para a área de transferência!",
      expect.objectContaining({ description: expect.any(String) })
    );

    // Export .TXT, .CSV, .JSON
    fireEvent.click(screen.getByRole("button", { name: ".TXT" }));
    fireEvent.click(screen.getByRole("button", { name: ".CSV" }));
    fireEvent.click(screen.getByRole("button", { name: ".JSON" }));

    expect(createObjectUrlMock).toHaveBeenCalledTimes(5);
    expect(anchorClickSpy).toHaveBeenCalledTimes(5);
    expect(revokeObjectUrlMock).toHaveBeenCalledTimes(5);
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Arquivo .TXT baixado com sucesso!"
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Arquivo .CSV baixado com sucesso!"
    );
    expect(mockToastSuccess).toHaveBeenCalledWith(
      "Arquivo .JSON baixado com sucesso!"
    );
  });
});

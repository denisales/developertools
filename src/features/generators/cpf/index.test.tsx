import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";

import { CpfGeneratorFeature } from "./index";
import * as cpfUtils from "./cpf-utils";
import { getCpfRegion, stripCpfDigits, validateCpf } from "./cpf-utils";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./cpf-utils", async (importOriginal) => {
  const actual = await importOriginal<typeof cpfUtils>();
  return {
    ...actual,
    getCpfRegion: vi.fn(actual.getCpfRegion),
  };
});

function activateTab(tabName: RegExp | string) {
  const tab = screen.getByRole("tab", { name: tabName });
  fireEvent.mouseDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab);
  return tab;
}

function selectOptionFromTrigger(trigger: HTMLElement, optionName: RegExp | string) {
  fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });
  const listbox = screen.getByRole("listbox");
  const option = within(listbox).getByRole("option", { name: optionName });
  fireEvent.click(option);
}

describe("CpfGeneratorFeature", () => {
  let writeTextMock: ReturnType<typeof vi.fn<(text: string) => Promise<void>>>;

  beforeEach(() => {
    vi.clearAllMocks();
    writeTextMock = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: writeTextMock,
        readText: vi.fn<() => Promise<string>>().mockResolvedValue(""),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("Generator Tab", () => {
    it("renders initial sample CPF, region badge, and recent history", () => {
      render(<CpfGeneratorFeature />);

      expect(
        screen.getByRole("heading", { name: /Gerador e Validador de CPF/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText("529.982.247-25").length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/9º Dígito 7 \(ES\/RJ\)/i)).toBeInTheDocument();
      expect(screen.getByText("1 item")).toBeInTheDocument();
      expect(screen.getByText(/7ª Região Fiscal: ES, RJ/i)).toBeInTheDocument();
    });

    it("generates a new CPF when clicking Gerar Novo and updates history", () => {
      render(<CpfGeneratorFeature />);

      const generateBtn = screen.getByRole("button", { name: /Gerar novo CPF/i });
      fireEvent.click(generateBtn);

      expect(screen.getByText("2 itens")).toBeInTheDocument();

      // Generate a few more times to ensure history caps at 5 items
      for (let i = 0; i < 6; i++) {
        fireEvent.click(generateBtn);
      }
      expect(screen.getByText("5 itens")).toBeInTheDocument();
    });

    it("copies generated CPF to clipboard, shows Copiado! temporarily, and handles clipboard errors", async () => {
      vi.useFakeTimers();
      render(<CpfGeneratorFeature />);

      const copyBtn = screen.getByRole("button", { name: /^Copiar$/i });
      await act(async () => {
        fireEvent.click(copyBtn);
      });

      expect(writeTextMock).toHaveBeenCalledWith("529.982.247-25");
      expect(toast.success).toHaveBeenCalledWith(
        "CPF copiado para a área de transferência!",
        expect.objectContaining({ description: "529.982.247-25" })
      );
      expect(screen.getByText("Copiado!")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.queryByText("Copiado!")).not.toBeInTheDocument();

      // Test clipboard rejection branch
      writeTextMock.mockRejectedValueOnce(new Error("Permission denied"));
      await act(async () => {
        fireEvent.click(screen.getByTitle("Clique para copiar o CPF"));
      });
      expect(toast.error).toHaveBeenCalledWith(
        "Não foi possível copiar automaticamente."
      );
    });

    it("toggles punctuation switch between formatted and unformatted CPF", () => {
      render(<CpfGeneratorFeature />);

      const formatSwitch = screen.getByRole("switch", { name: /Pontuação/i });
      expect(formatSwitch).toHaveAttribute("aria-checked", "true");
      expect(screen.getByText("000.000.000-00")).toBeInTheDocument();

      fireEvent.click(formatSwitch);

      expect(formatSwitch).toHaveAttribute("aria-checked", "false");
      expect(screen.getByText("00000000000")).toBeInTheDocument();
      expect(screen.getAllByText("52998224725").length).toBeGreaterThanOrEqual(1);

      fireEvent.click(formatSwitch);
      expect(screen.getAllByText("529.982.247-25").length).toBeGreaterThanOrEqual(1);
    });

    it("changes UF via selector and via fiscal region table badges", () => {
      render(<CpfGeneratorFeature />);

      const trigger = screen.getByRole("combobox", { name: /Estado \(UF\)/i });
      selectOptionFromTrigger(trigger, /SP — São Paulo/i);

      expect(screen.getByText(/UF: SP • Dígito 8/i)).toBeInTheDocument();
      const displayed = screen.getByTitle("Clique para copiar o CPF").textContent ?? "";
      const clean = stripCpfDigits(displayed);
      expect(clean[8]).toBe("8");
      expect(validateCpf(clean).isValid).toBe(true);

      // Click a UF badge in the fiscal region table (e.g., DF which belongs to a >3-state region)
      const dfBadge = screen.getByTitle("Gerar CPF de DF");
      fireEvent.click(dfBadge);
      expect(screen.getByText(/UF: DF • Dígito 1/i)).toBeInTheDocument();

      // Switch back to ALL via selector with deterministic 9th digit = 1 (DF, GO, MS, MT, TO -> >3 states ellipsis)
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.15);
      // After 1st digit 0.15 -> 1 (d9), vary subsequent digits so baseDigits aren't all identical
      randomSpy
        .mockReturnValueOnce(0.15)
        .mockReturnValueOnce(0.25)
        .mockReturnValueOnce(0.35);
      selectOptionFromTrigger(trigger, /Qualquer UF/i);
      expect(screen.getByText(/9º Dígito 1 \(DF\/GO\/MS…\)/i)).toBeInTheDocument();
      expect(screen.getByText(/1ª Região Fiscal: DF, GO, MS, MT, TO/i)).toBeInTheDocument();
    });

    it("copies a recent history item via row click and icon button", async () => {
      render(<CpfGeneratorFeature />);

      // Click the icon copy button inside the history card
      const rowCopyBtn = screen.getByRole("button", {
        name: "Copiar 529.982.247-25",
      });
      await act(async () => {
        fireEvent.click(rowCopyBtn);
      });
      expect(writeTextMock).toHaveBeenCalledWith("529.982.247-25");

      // Click the history row container directly
      const historyCard = screen
        .getByText("Histórico Recente")
        .closest("[data-slot='card']");
      expect(historyCard).not.toBeNull();
      const row = within(historyCard as HTMLElement)
        .getByText("529.982.247-25")
        .closest("div.cursor-pointer");
      expect(row).not.toBeNull();

      await act(async () => {
        fireEvent.click(row as HTMLElement);
      });
      expect(writeTextMock).toHaveBeenCalledTimes(2);
    });

    it("navigates to Validator tab pre-filled when clicking Ver cálculo", () => {
      render(<CpfGeneratorFeature />);

      fireEvent.click(screen.getByRole("button", { name: /Ver cálculo/i }));

      const validatorInput = screen.getByLabelText(/Número de CPF para validar/i);
      expect(validatorInput).toHaveValue("529.982.247-25");
      expect(screen.getByText("CPF Válido")).toBeInTheDocument();
    });
  });

  describe("Validator Tab", () => {
    it("shows empty prompt initially and validates typed valid, repeated, partial, and invalid CPFs", () => {
      render(<CpfGeneratorFeature />);
      activateTab(/Validar/i);

      expect(
        screen.getByText(/Digite os 11 dígitos do CPF acima para conferir/i)
      ).toBeInTheDocument();

      const input = screen.getByLabelText(/Número de CPF para validar/i);

      // Partial input -> INVALID_LENGTH
      fireEvent.change(input, { target: { value: "12345" } });
      expect(input).toHaveValue("123.45");
      expect(screen.getByText("CPF Inválido")).toBeInTheDocument();
      expect(
        screen.getByText(/O CPF deve conter exatamente 11 dígitos numéricos/i)
      ).toBeInTheDocument();

      // Repeated digits -> REPEATED_DIGITS
      fireEvent.change(input, { target: { value: "11111111111" } });
      expect(input).toHaveValue("111.111.111-11");
      expect(screen.getByText("CPF Inválido")).toBeInTheDocument();
      expect(
        screen.getByText(/Sequências de 11 dígitos repetidos são bloqueadas/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Região Fiscal \(9º Dígito: 1\)/i)).toBeInTheDocument();

      // Invalid check digits -> renders breakdown with mismatch
      fireEvent.change(input, { target: { value: "52998224730" } });
      expect(screen.getByText("CPF Inválido")).toBeInTheDocument();
      expect(
        screen.getByText(/Dígitos verificadores inválidos/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/1º Dígito Verificador \(10º dígito\)/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/2º Dígito Verificador \(11º dígito\)/i)
      ).toBeInTheDocument();

      // Valid CPF with DV1 remainder < 2 (39053344705)
      fireEvent.change(input, { target: { value: "39053344705" } });
      expect(screen.getByText("CPF Válido")).toBeInTheDocument();
      expect(screen.getByText(/0 \(pois resto < 2\)/i)).toBeInTheDocument();
      expect(screen.getByText(/11 - 6 = 5/i)).toBeInTheDocument();

      // Valid CPF with DV2 remainder < 2 (00000001830: DV1=3, DV2=0)
      fireEvent.change(input, { target: { value: "00000001830" } });
      expect(screen.getByText("CPF Válido")).toBeInTheDocument();
      expect(screen.getByText(/11 - 8 = 3/i)).toBeInTheDocument();
      expect(screen.getByText(/0 \(pois resto < 2\)/i)).toBeInTheDocument();
    });

    it("supports Testar CPF Válido quick sample and Limpar campo action", () => {
      render(<CpfGeneratorFeature />);
      activateTab(/Validar/i);

      fireEvent.click(screen.getByRole("button", { name: /Testar CPF Válido/i }));
      const input = screen.getByLabelText(
        /Número de CPF para validar/i
      ) as HTMLInputElement;
      expect(validateCpf(input.value).isValid).toBe(true);
      expect(screen.getByText("CPF Válido")).toBeInTheDocument();

      const clearBtn = screen.getByRole("button", { name: /Limpar campo/i });
      fireEvent.click(clearBtn);
      expect(input.value).toBe("");
      expect(
        screen.getByText(/Digite os 11 dígitos do CPF acima para conferir/i)
      ).toBeInTheDocument();
    });
  });

  describe("Bulk Tab", () => {
    it("changes batch quantity via input, preset buttons, state select, and punctuation switch", () => {
      render(<CpfGeneratorFeature />);
      activateTab(/Em Lote/i);

      expect(screen.getByText("10 CPFs gerados")).toBeInTheDocument();

      // Change quantity input to empty (fallback to 1), then 4 and click Gerar
      const qtyInput = screen.getByLabelText(/Quantidade \(1 a 100\)/i);
      fireEvent.change(qtyInput, { target: { value: "" } });
      expect(screen.getByRole("button", { name: /Gerar 1 CPFs/i })).toBeInTheDocument();
      fireEvent.change(qtyInput, { target: { value: "4" } });
      fireEvent.click(screen.getByRole("button", { name: /Gerar 4 CPFs/i }));
      expect(screen.getByText("4 CPFs gerados")).toBeInTheDocument();

      // Test preset button (e.g., 25)
      fireEvent.click(screen.getByRole("button", { name: "25" }));
      expect(screen.getByText("25 CPFs gerados")).toBeInTheDocument();
      expect(toast.success).toHaveBeenCalledWith("25 CPFs gerados com sucesso!");

      // Filter bulk by UF (SP -> 9th digit 8) and then back to ALL
      const bulkStateTrigger = screen.getByRole("combobox", {
        name: /Estado de Origem \(UF\)/i,
      });
      selectOptionFromTrigger(bulkStateTrigger, /SP — São Paulo/i);
      expect(
        screen.getByText(/25 CPFs gerados para SP \(9º dígito 8\)/i)
      ).toBeInTheDocument();
      selectOptionFromTrigger(bulkStateTrigger, /Qualquer Estado/i);
      expect(screen.getByText("25 CPFs gerados")).toBeInTheDocument();

      // Toggle punctuation off
      const bulkFormatSwitch = screen.getByRole("switch", {
        name: /Incluir pontuação/i,
      });
      fireEvent.click(bulkFormatSwitch);
      expect(bulkFormatSwitch).toHaveAttribute("aria-checked", "false");

      const firstCopyBtn = screen.getAllByRole("button", { name: /^Copiar \d{11}$/ })[0];
      expect(firstCopyBtn).toBeInTheDocument();
    });

    it("copies all or individual bulk CPFs and truncates long toast descriptions", async () => {
      render(<CpfGeneratorFeature />);
      activateTab(/Em Lote/i);

      // Copy individual item #1
      const itemCopyButtons = screen.getAllByRole("button", {
        name: /^Copiar \d{3}\.\d{3}\.\d{3}-\d{2}$/,
      });
      await act(async () => {
        fireEvent.click(itemCopyButtons[0]);
      });
      expect(toast.success).toHaveBeenCalledWith(
        "CPF #1 copiado para a área de transferência!",
        expect.any(Object)
      );

      // Copy all (description > 40 chars -> truncated with ...)
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Copiar Todos/i }));
      });
      expect(writeTextMock).toHaveBeenLastCalledWith(
        expect.stringContaining("\n")
      );
      expect(toast.success).toHaveBeenLastCalledWith(
        "10 CPFs copiado para a área de transferência!",
        expect.objectContaining({
          description: expect.stringMatching(/\.\.\.$/),
        })
      );
    });

    it("exports .TXT, .CSV, and .JSON files cleanly via Blob and anchor download", async () => {
      const createdBlobs: Blob[] = [];
      const createObjectURLMock = vi.fn((blob: Blob) => {
        createdBlobs.push(blob);
        return "blob:mock-url";
      });
      const revokeObjectURLMock = vi.fn();

      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        writable: true,
        value: createObjectURLMock,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        writable: true,
        value: revokeObjectURLMock,
      });

      const clickSpy = vi
        .spyOn(HTMLAnchorElement.prototype, "click")
        .mockImplementation(() => {});

      render(<CpfGeneratorFeature />);
      activateTab(/Em Lote/i);

      // Export .TXT
      fireEvent.click(screen.getByRole("button", { name: /\.TXT/i }));
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(revokeObjectURLMock).toHaveBeenCalledWith("blob:mock-url");
      expect(toast.success).toHaveBeenCalledWith("Arquivo cpfs-10.txt baixado!");
      expect(createdBlobs[0].type).toBe("text/plain;charset=utf-8");

      // Export .CSV
      fireEvent.click(screen.getByRole("button", { name: /\.CSV/i }));
      expect(createObjectURLMock).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith("Arquivo cpfs-10.csv baixado!");
      const csvText = await createdBlobs[1].text();
      expect(csvText).toContain(
        "indice,cpf_formatado,cpf_apenas_numeros,nono_digito,regiao_fiscal,estados_uf"
      );

      // Export .JSON (formatted)
      fireEvent.click(screen.getByRole("button", { name: /\.JSON/i }));
      expect(createObjectURLMock).toHaveBeenCalledTimes(3);
      expect(toast.success).toHaveBeenCalledWith("Arquivo cpfs-10.json baixado!");
      const jsonText = await createdBlobs[2].text();
      const parsed = JSON.parse(jsonText) as Array<{
        index: number;
        cpf: string;
        formatted: string;
        digitsOnly: string;
      }>;
      expect(parsed).toHaveLength(10);
      expect(parsed[0].cpf).toBe(parsed[0].formatted);

      // Toggle punctuation off and export .JSON again to verify digitsOnly branch
      fireEvent.click(screen.getByRole("switch", { name: /Incluir pontuação/i }));
      fireEvent.click(screen.getByRole("button", { name: /\.JSON/i }));
      const unformattedJson = JSON.parse(
        await createdBlobs[3].text()
      ) as Array<{ cpf: string; digitsOnly: string }>;
      expect(unformattedJson[0].cpf).toBe(unformattedJson[0].digitsOnly);
    });

    it("handles defensive null fiscal region fallbacks across generator and bulk exports", async () => {
      vi.mocked(getCpfRegion).mockReturnValue(null);

      const createdBlobs: Blob[] = [];
      Object.defineProperty(URL, "createObjectURL", {
        configurable: true,
        writable: true,
        value: vi.fn((blob: Blob) => {
          createdBlobs.push(blob);
          return "blob:mock-null-region";
        }),
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        configurable: true,
        writable: true,
        value: vi.fn(),
      });
      vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

      render(<CpfGeneratorFeature />);
      expect(
        screen.getByText("Regra oficial da Receita Federal")
      ).toBeInTheDocument();

      activateTab(/Em Lote/i);
      fireEvent.click(screen.getByRole("button", { name: /\.CSV/i }));
      fireEvent.click(screen.getByRole("button", { name: /\.JSON/i }));

      const csvText = await createdBlobs[0].text();
      expect(csvText).toContain(',"",""');

      const jsonPayload = JSON.parse(await createdBlobs[1].text()) as Array<{
        fiscalRegion: string;
        states: string[];
      }>;
      expect(jsonPayload[0].fiscalRegion).toBe("");
      expect(jsonPayload[0].states).toEqual([]);

      // Restore default implementation
      vi.mocked(getCpfRegion).mockImplementation((digit: number) =>
        cpfUtils.FISCAL_REGIONS[digit] ?? null
      );
    });
  });
});

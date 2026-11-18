import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import type { MarketIndicators } from "@/services/bcb/bcb-client";
import CompoundInterestFeature from "./index";
import {
  BcbPresetsSkeleton,
  CompoundInterestSkeleton,
} from "./compound-interest-skeleton";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

const MOCK_INDICATORS: MarketIndicators = {
  selicMeta: {
    seriesId: 432,
    name: "Taxa Selic Meta",
    unit: "% a.a.",
    value: 14.25,
    date: "18/11/2026",
    source: "bcb",
  },
  taxaDi: {
    seriesId: 4389,
    name: "Taxa DI (CDI)",
    unit: "% a.a.",
    value: 14.15,
    date: "18/11/2026",
    source: "bcb",
  },
  ipcaMensal: {
    seriesId: 433,
    name: "IPCA Mensal",
    unit: "% a.m.",
    value: 0.42,
    date: "18/11/2026",
    source: "bcb",
  },
  ipca12Meses: {
    seriesId: 13522,
    name: "IPCA Acumulado 12m",
    unit: "% a.a.",
    value: 4.5,
    date: "18/11/2026",
    source: "bcb",
  },
  dolarPtaxVenda: {
    seriesId: 1,
    name: "Dólar PTAX Venda",
    unit: "R$",
    value: 5.7845,
    date: "18/11/2026",
    source: "bcb",
  },
  dolarPtaxCompra: {
    seriesId: 10813,
    name: "Dólar PTAX Compra",
    unit: "R$",
    value: 5.7839,
    date: "18/11/2026",
    source: "bcb",
  },
  poupancaAnual: {
    seriesId: 195,
    name: "Poupança Anual",
    unit: "% a.a.",
    value: 6.17,
    date: "18/11/2026",
    source: "bcb",
  },
  ipcaPlus6Anual: {
    seriesId: 13522,
    name: "IPCA + 6% a.a.",
    unit: "% a.a.",
    value: 10.77,
    date: "18/11/2026",
    source: "bcb",
  },
  updatedAt: "2026-11-18T05:45:00.000Z",
  usedFallback: false,
};

function createJsonResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

describe("CompoundInterestFeature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse(MOCK_INDICATORS)
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders SSR initialIndicators immediately with zero mount fetch and zero flicker", () => {
    const { container } = render(
      <CompoundInterestFeature initialIndicators={MOCK_INDICATORS} />
    );

    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(screen.queryByTestId("bcb-presets-skeleton")).not.toBeInTheDocument();
    expect(screen.getByTestId("bcb-presets-bar")).toBeInTheDocument();
    expect(screen.getByTestId("bcb-indicators-status")).toHaveTextContent(
      "Taxas BCB • Ref. 18/11/2026 • IPCA 12m: 4,50% • Dólar PTAX: R$ 5,78"
    );
    expect(screen.getByTestId("preset-cdi-100")).toHaveTextContent(
      "CDI 14,15%"
    );
    expect(screen.getByTestId("refresh-bcb-indicators")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /Calculadora de Juros Compostos/i })
    ).toBeInTheDocument();

    const resultSection = document.getElementById("result");
    expect(resultSection).not.toBeNull();
    const resultScope = within(resultSection as HTMLElement);

    expect(resultScope.getByText("Valor Total Final")).toBeInTheDocument();
    expect(resultScope.getByText("Total Investido")).toBeInTheDocument();
    expect(resultScope.getByText("Total em Juros")).toBeInTheDocument();

    expect(container.querySelector("#amount")).toHaveTextContent("102.525,67");
    expect(container.querySelector("#invested")).toHaveTextContent("61.000,00");
    expect(container.querySelector("#interest")).toHaveTextContent("41.525,67");
    expect(screen.getByText(/após 120 meses/i)).toBeInTheDocument();

    expect(
      screen.getByRole("img", {
        name: /Gráfico de rosca de proporção entre valor investido e total em juros/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Composição do Montante")).toBeInTheDocument();
    expect(screen.getByText("Evolução Patrimonial no Tempo")).toBeInTheDocument();
    expect(screen.getByText("Tabela de Evolução Detalhada")).toBeInTheDocument();
    expect(
      screen.getByText("Como Funciona o Cálculo de Juros Compostos?")
    ).toBeInTheDocument();
  });

  it("applies all preset chips and updates rate and equivalence display", () => {
    render(<CompoundInterestFeature initialIndicators={MOCK_INDICATORS} />);

    const presetExpectations = [
      { chip: "Selic 14,25%", rateValue: "14,25", equivSuffix: "% a.m." },
      { chip: "CDI 14,15%", rateValue: "14,15", equivSuffix: "% a.m." },
      { chip: "IPCA+ 10,77%", rateValue: "10,77", equivSuffix: "% a.m." },
      { chip: "1% a.m.", rateValue: "1,00", equivSuffix: "% a.a." },
      { chip: "Poupança 6,17%", rateValue: "6,17", equivSuffix: "% a.m." },
    ];

    const rateInput = screen.getByLabelText("Taxa de Juros") as HTMLInputElement;

    for (const item of presetExpectations) {
      fireEvent.click(screen.getByRole("button", { name: item.chip }));
      expect(rateInput.value).toBe(item.rateValue);
      expect(
        screen.getByText((content) => content.includes(item.equivSuffix) && content.startsWith("≈"))
      ).toBeInTheDocument();
    }

    expect(toast.success).toHaveBeenCalledTimes(presetExpectations.length);
  });

  it("updates inputs, quick increments, selects (Anual/Mensal, Anos/Meses), and submits form", () => {
    const { container } = render(
      <CompoundInterestFeature initialIndicators={MOCK_INDICATORS} />
    );

    const initialInput = screen.getByLabelText("Valor Inicial em Reais");
    const monthlyInput = screen.getByLabelText("Aporte Mensal em Reais");
    const rateInput = screen.getByLabelText("Taxa de Juros");
    const periodInput = screen.getByLabelText("Período da Simulação");

    fireEvent.change(initialInput, { target: { value: "1000000" } }); // R$ 10.000,00
    expect((initialInput as HTMLInputElement).value).toBe("10.000,00");

    fireEvent.change(monthlyInput, { target: { value: "100000" } }); // R$ 1.000,00
    expect((monthlyInput as HTMLInputElement).value).toBe("1.000,00");

    // Quick increment buttons (+1k on initialValue, +200 on monthlyContribution)
    const plusOneKButtons = screen.getAllByRole("button", { name: "+1k" });
    fireEvent.click(plusOneKButtons[0]); // initialValue -> 11.000,00
    expect((initialInput as HTMLInputElement).value).toBe("11.000,00");

    fireEvent.click(screen.getByRole("button", { name: "+200" })); // monthly -> 1.200,00
    expect((monthlyInput as HTMLInputElement).value).toBe("1.200,00");

    // Change rate and toggle rateUnit via Select (Anual -> Mensal)
    fireEvent.change(rateInput, { target: { value: "1" } });
    const rateSelectTrigger = screen.getByLabelText("Unidade da Taxa de Juros");
    fireEvent.keyDown(rateSelectTrigger, { key: "Enter" });
    fireEvent.click(screen.getByRole("option", { name: "Mensal" }));
    expect(screen.getByText(/≈ 12,68% a\.a\./)).toBeInTheDocument();

    // Change period and toggle periodUnit via Select (Anos -> Meses)
    fireEvent.change(periodInput, { target: { value: "12" } });
    const periodSelectTrigger = screen.getByLabelText("Unidade do Período");
    fireEvent.keyDown(periodSelectTrigger, { key: "Enter" });
    fireEvent.click(screen.getByRole("option", { name: "Meses" }));
    expect(screen.getByText(/após 12 meses/i)).toBeInTheDocument();

    // Verify chart switches to monthly mode (<= 36 months)
    expect(
      screen.getByText(/Toque ou passe o mouse nas colunas para inspecionar cada mês/i)
    ).toBeInTheDocument();

    // Submit form
    fireEvent.click(
      screen.getByRole("button", { name: /Calcular Juros Compostos/i })
    );
    expect(toast.success).toHaveBeenCalledWith(
      "Simulação de juros compostos atualizada!"
    );

    // Quick period button (e.g., 30a) triggers > 25 points sampling in chart
    fireEvent.click(screen.getByRole("button", { name: "30a" }));
    expect(screen.getByText(/após 360 meses/i)).toBeInTheDocument();

    // 29 months triggers sampling fallback pushing last element when step does not land on final index
    fireEvent.change(periodInput, { target: { value: "29" } });
    fireEvent.keyDown(periodSelectTrigger, { key: "Enter" });
    fireEvent.click(screen.getByRole("option", { name: "Meses" }));
    expect(screen.getByText(/após 29 meses/i)).toBeInTheDocument();

    // Non-numeric rate & period inputs fall back safely to 0
    fireEvent.change(rateInput, { target: { value: "abc" } });
    fireEvent.change(periodInput, { target: { value: "" } });
    expect(container.querySelector("#amount")).toHaveTextContent("11.000,00");
  });

  it("interacts with chart bars via hover, focus, and click and updates inspection panel", () => {
    render(<CompoundInterestFeature initialIndicators={MOCK_INDICATORS} />);

    const chartSection = document.getElementById("resultGraphic");
    expect(chartSection).not.toBeNull();

    const firstBar = screen.getByRole("button", { name: /^Período 0:/i });
    const midBar = screen.getByRole("button", { name: /^Período 12:/i });
    const endBar = screen.getByRole("button", { name: /^Período 120:/i });

    fireEvent.mouseEnter(firstBar);
    expect(within(chartSection as HTMLElement).getByText("Mês 0 (Início)")).toBeInTheDocument();

    fireEvent.focus(midBar);
    expect(within(chartSection as HTMLElement).getByText("Ano 1 (12m)")).toBeInTheDocument();

    fireEvent.click(endBar);
    expect(within(chartSection as HTMLElement).getByText("Ano 10 (120m)")).toBeInTheDocument();

    // Switch to 12 months to verify monthly inspection label
    fireEvent.click(screen.getByRole("button", { name: "1a" }));
    const monthThreeBar = screen.getByRole("button", { name: /^Período 3:/i });
    fireEvent.click(monthThreeBar);
    expect(within(chartSection as HTMLElement).getByText("Mês 3")).toBeInTheDocument();
  });

  it("toggles table modes (Mensal vs Anual), expands/collapses rows, and exports CSV", () => {
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    render(<CompoundInterestFeature initialIndicators={MOCK_INDICATORS} />);

    const tableSection = document.getElementById("evolutionTable");
    expect(tableSection).not.toBeNull();

    // Initially monthly mode truncated at 25 rows (Mês 0..24)
    expect(screen.getByText("Mês 0")).toBeInTheDocument();
    expect(screen.queryByText("Mês 25")).not.toBeInTheDocument();

    // Expand all 120 months
    fireEvent.click(
      screen.getByRole("button", { name: /Mostrar todos os 120 meses/i })
    );
    expect(screen.getByText("Mês 120")).toBeInTheDocument();

    // Collapse back
    fireEvent.click(
      screen.getByRole("button", {
        name: /Recolher tabela \(mostrar primeiros 24 meses\)/i,
      })
    );
    expect(screen.queryByText("Mês 120")).not.toBeInTheDocument();

    // Export CSV in monthly mode
    fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/i }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
    expect(toast.success).toHaveBeenCalledWith(
      "Planilha CSV exportada com sucesso!"
    );

    // Switch Tabs to Anual
    const tableScope = within(tableSection as HTMLElement);
    const yearlyTab = tableScope.getByRole("tab", { name: /Anual \(11\)/i });
    fireEvent.mouseDown(yearlyTab, { button: 0, ctrlKey: false });
    expect(tableScope.getByText("Início")).toBeInTheDocument();
    expect(tableScope.getByText("Ano 10 (120m)")).toBeInTheDocument();

    // Export CSV in yearly mode
    fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/i }));
    expect(createObjectURLSpy).toHaveBeenCalledTimes(2);
    expect(anchorClickSpy).toHaveBeenCalledTimes(2);
  });

  it("clears and restores defaults, and handles summary copy success and failure", async () => {
    vi.useFakeTimers();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: writeTextMock },
    });

    const { container } = render(
      <CompoundInterestFeature initialIndicators={MOCK_INDICATORS} />
    );

    // Clear all fields
    fireEvent.click(screen.getByRole("button", { name: /Limpar/i }));
    expect(container.querySelector("#amount")).toHaveTextContent("0,00");
    expect(container.querySelector("#interest")).toHaveTextContent("0,00");
    expect(toast.info).toHaveBeenCalledWith(
      "Campos limpos. Insira novos valores para simular."
    );

    // Restore defaults
    fireEvent.click(screen.getByRole("button", { name: /Restaurar/i }));
    expect(container.querySelector("#amount")).toHaveTextContent("102.525,67");
    expect(toast.success).toHaveBeenCalledWith("Valores padrão restaurados.");

    // Copy summary success
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Copiar/i }));
    });
    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock.mock.calls[0]?.[0]).toContain(
      "Simulação de Juros Compostos"
    );
    expect(screen.getByText("Copiado")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(
      "Resumo da simulação copiado para a área de transferência!"
    );

    // Timer resets copied label after 2000ms
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText("Copiado")).not.toBeInTheDocument();

    // Copy summary failure
    writeTextMock.mockRejectedValueOnce(new Error("Clipboard denied"));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Copiar/i }));
    });
    expect(toast.error).toHaveBeenCalledWith(
      "Não foi possível copiar o resumo automaticamente."
    );
  });

  it("shows bcb-presets-skeleton in standalone mode before /api/indicators resolves, then renders dynamic rates", async () => {
    const dynamicIndicators: MarketIndicators = {
      ...MOCK_INDICATORS,
      selicMeta: {
        ...MOCK_INDICATORS.selicMeta,
        value: 15.25,
        date: "20/11/2026",
      },
      taxaDi: {
        ...MOCK_INDICATORS.taxaDi,
        value: 15.15,
        date: "20/11/2026",
      },
      ipca12Meses: {
        ...MOCK_INDICATORS.ipca12Meses,
        value: 4.85,
        date: "20/11/2026",
      },
      ipcaPlus6Anual: {
        ...MOCK_INDICATORS.ipcaPlus6Anual,
        value: 11.14,
        date: "20/11/2026",
      },
      poupancaAnual: {
        ...MOCK_INDICATORS.poupancaAnual,
        value: 7.12,
        date: "20/11/2026",
      },
      dolarPtaxVenda: {
        ...MOCK_INDICATORS.dolarPtaxVenda,
        value: 5.92,
        date: "20/11/2026",
      },
      usedFallback: false,
    };

    let resolveFetch!: (value: Response) => void;
    const pendingFetch = new Promise<Response>((resolve) => {
      resolveFetch = resolve;
    });

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockReturnValueOnce(pendingFetch);

    render(<CompoundInterestFeature />);

    // Skeleton must be shown instead of stale/default presets while loading
    const skeleton = screen.getByTestId("bcb-presets-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(screen.queryByTestId("preset-cdi-100")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bcb-indicators-status")).not.toBeInTheDocument();

    await act(async () => {
      resolveFetch(createJsonResponse(dynamicIndicators));
    });

    await waitFor(() => {
      expect(screen.getByTestId("preset-selic")).toHaveTextContent(
        "Selic 15,25%"
      );
    });

    expect(screen.queryByTestId("bcb-presets-skeleton")).not.toBeInTheDocument();
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/indicators",
      expect.objectContaining({ cache: "no-store" })
    );
    expect(screen.getByTestId("preset-cdi-100")).toHaveTextContent(
      "CDI 15,15%"
    );
    expect(screen.getByTestId("preset-ipca-plus")).toHaveTextContent(
      "IPCA+ 11,14%"
    );
    expect(screen.getByTestId("preset-poupanca")).toHaveTextContent(
      "Poupança 7,12%"
    );
    expect(screen.getByTestId("bcb-indicators-status")).toHaveTextContent(
      "Taxas BCB • Ref. 20/11/2026 • IPCA 12m: 4,85% • Dólar PTAX: R$ 5,92"
    );

    const rateInput = screen.getByLabelText("Taxa de Juros") as HTMLInputElement;
    fireEvent.click(screen.getByTestId("preset-cdi-100"));
    expect(rateInput.value).toBe("15,15");

    fireEvent.click(screen.getByTestId("preset-ipca-plus"));
    expect(rateInput.value).toBe("11,14");
  });

  it("shows skeleton while refreshing via refresh-bcb-indicators and handles success and HTTP 500 fallback", async () => {
    const refreshedIndicators: MarketIndicators = {
      ...MOCK_INDICATORS,
      selicMeta: {
        ...MOCK_INDICATORS.selicMeta,
        value: 14.75,
        date: "19/11/2026",
      },
      taxaDi: {
        ...MOCK_INDICATORS.taxaDi,
        value: 14.65,
        date: "19/11/2026",
      },
    };

    let resolveRefresh!: (value: Response) => void;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementationOnce(
        () =>
          new Promise<Response>((resolve) => {
            resolveRefresh = resolve;
          })
      );

    render(<CompoundInterestFeature initialIndicators={MOCK_INDICATORS} />);
    expect(fetchSpy).not.toHaveBeenCalled();

    // Trigger manual refresh
    fireEvent.click(screen.getByTestId("refresh-bcb-indicators"));

    // Skeleton replaces old preset chips while loading (zero stale values shown)
    expect(screen.getByTestId("bcb-presets-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("preset-cdi-100")).not.toBeInTheDocument();

    await act(async () => {
      resolveRefresh(createJsonResponse(refreshedIndicators));
    });

    await waitFor(() => {
      expect(screen.getByTestId("preset-cdi-100")).toHaveTextContent(
        "CDI 14,65%"
      );
    });
    expect(screen.getByTestId("bcb-indicators-status")).toHaveTextContent(
      "Taxas BCB • Ref. 19/11/2026"
    );

    // Trigger second refresh that fails with HTTP 500
    fetchSpy.mockResolvedValueOnce(
      createJsonResponse({ error: "BCB unavailable" }, false, 500)
    );
    fireEvent.click(screen.getByTestId("refresh-bcb-indicators"));

    await waitFor(() => {
      expect(screen.getByTestId("bcb-indicators-status")).toHaveTextContent(
        "Taxas de referência padrão • Selic 14,25% • CDI 14,15% • IPCA+ 10,77%"
      );
    });
    expect(screen.getByTestId("preset-cdi-100")).toHaveTextContent(
      "CDI 14,15%"
    );
  });

  it("displays reserve reference label when /api/indicators responds with usedFallback=true", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      createJsonResponse({
        ...MOCK_INDICATORS,
        usedFallback: true,
      })
    );

    render(<CompoundInterestFeature />);

    await waitFor(() => {
      expect(screen.getByTestId("bcb-indicators-status")).toHaveTextContent(
        "Taxas BCB (ref. reserva)"
      );
    });
  });

  it("falls back gracefully when /api/indicators returns HTTP 500, invalid JSON, or rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      createJsonResponse({ error: "BCB unavailable" }, false, 500)
    );

    const { unmount } = render(<CompoundInterestFeature />);

    await waitFor(() => {
      expect(screen.getByTestId("bcb-indicators-status")).toHaveTextContent(
        "Taxas de referência padrão • Selic 14,25% • CDI 14,15% • IPCA+ 10,77%"
      );
    });

    const rateInput = screen.getByLabelText("Taxa de Juros") as HTMLInputElement;
    fireEvent.click(screen.getByTestId("preset-cdi-100"));
    expect(rateInput.value).toBe("14,15");
    unmount();

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      createJsonResponse({ unexpected: true })
    );
    const { unmount: unmountInvalid } = render(<CompoundInterestFeature />);
    await waitFor(() => {
      expect(screen.getByTestId("bcb-indicators-status")).toHaveTextContent(
        "Taxas de referência padrão"
      );
    });
    unmountInvalid();

    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new Error("Network error")
    );
    render(<CompoundInterestFeature />);

    await waitFor(() => {
      expect(screen.getByTestId("bcb-indicators-status")).toHaveTextContent(
        "Taxas de referência padrão"
      );
    });
    expect(screen.getByTestId("preset-selic")).toHaveTextContent(
      "Selic 14,25%"
    );
  });

  it("aborts pending /api/indicators fetch on unmount", () => {
    let capturedSignal: AbortSignal | undefined;
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(
      (_input, init?: RequestInit) => {
        capturedSignal = init?.signal ?? undefined;
        return new Promise<Response>(() => {});
      }
    );

    const { unmount } = render(<CompoundInterestFeature />);
    expect(capturedSignal?.aborted).toBe(false);
    unmount();
    expect(capturedSignal?.aborted).toBe(true);
  });
});

describe("CompoundInterestSkeleton & BcbPresetsSkeleton", () => {
  it("renders 5 preset pill skeletons and 1 status caption inside #presets-bar", () => {
    const { container } = render(<BcbPresetsSkeleton />);
    const wrapper = screen.getByTestId("bcb-presets-skeleton");
    expect(wrapper).toBeInTheDocument();

    const presetsBar = container.querySelector("#presets-bar");
    expect(presetsBar).not.toBeNull();
    const pills = presetsBar?.querySelectorAll('[data-slot="skeleton"]');
    expect(pills).toHaveLength(5);

    const allSkeletons = wrapper.querySelectorAll('[data-slot="skeleton"]');
    expect(allSkeletons).toHaveLength(6);
  });

  it("renders full-page CompoundInterestSkeleton with presets, 4 inputs, and 3 summary cards", () => {
    const { container } = render(<CompoundInterestSkeleton />);
    expect(
      screen.getByTestId("compound-interest-skeleton")
    ).toBeInTheDocument();
    expect(screen.getByTestId("bcb-presets-skeleton")).toBeInTheDocument();

    const cards = container.querySelectorAll('[data-slot="card"]');
    // 1 main simulation card + 3 summary cards
    expect(cards).toHaveLength(4);
  });
});

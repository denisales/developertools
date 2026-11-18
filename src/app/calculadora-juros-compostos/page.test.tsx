import * as React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MarketIndicators } from "@/services/bcb/bcb-client";
import CalculadoraJurosCompostosPage, { dynamic } from "./page";

const MOCK_SSR_INDICATORS: MarketIndicators = {
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

const getMarketIndicatorsMock = vi.fn(async () => MOCK_SSR_INDICATORS);

vi.mock("@/services/bcb/bcb-client", () => ({
  getMarketIndicators: () => getMarketIndicatorsMock(),
}));

describe("CalculadoraJurosCompostosPage", () => {
  it("exports dynamic = 'force-dynamic'", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("wraps async server component in Suspense with CompoundInterestSkeleton fallback and passes initialIndicators", async () => {
    const pageElement = CalculadoraJurosCompostosPage();
    expect(React.isValidElement(pageElement)).toBe(true);
    expect(pageElement.type).toBe(React.Suspense);

    const { fallback, children } = pageElement.props as {
      fallback: React.ReactElement;
      children: React.ReactElement;
    };

    const { unmount } = render(fallback);
    expect(
      screen.getByTestId("compound-interest-skeleton")
    ).toBeInTheDocument();
    unmount();

    const serverComponent = children.type as () => Promise<React.ReactElement>;
    const resolvedFeature = await serverComponent();
    expect(getMarketIndicatorsMock).toHaveBeenCalledTimes(1);

    render(resolvedFeature);
    expect(screen.getByTestId("bcb-indicators-status")).toHaveTextContent(
      "Taxas BCB • Ref. 18/11/2026 • IPCA 12m: 4,50% • Dólar PTAX: R$ 5,78"
    );
    expect(screen.getByTestId("preset-cdi-100")).toHaveTextContent(
      "CDI 14,15%"
    );
  });
});

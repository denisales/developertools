import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MarketIndicators } from "@/services/bcb/bcb-client";
import * as bcbClient from "@/services/bcb/bcb-client";
import { GET } from "./route";

const ORIGINAL_ENV = process.env.BCB_API_BASE_URL;

const SAMPLE_INDICATORS: MarketIndicators = {
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

describe("GET /api/indicators", () => {
  beforeEach(() => {
    delete process.env.BCB_API_BASE_URL;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (ORIGINAL_ENV === undefined) {
      delete process.env.BCB_API_BASE_URL;
    } else {
      process.env.BCB_API_BASE_URL = ORIGINAL_ENV;
    }
  });

  it("returns 200 JSON with public CDN Cache-Control when BCB_API_BASE_URL is unset", async () => {
    vi.spyOn(bcbClient, "getMarketIndicators").mockResolvedValue(
      SAMPLE_INDICATORS,
    );

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=3600, stale-while-revalidate=7200",
    );

    const payload = (await response.json()) as MarketIndicators;
    expect(payload).toEqual(SAMPLE_INDICATORS);
  });

  it("returns Cache-Control: no-store when BCB_API_BASE_URL is configured for mock/E2E", async () => {
    process.env.BCB_API_BASE_URL = "http://127.0.0.1:4100";
    vi.spyOn(bcbClient, "getMarketIndicators").mockResolvedValue({
      ...SAMPLE_INDICATORS,
      usedFallback: true,
    });

    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const payload = (await response.json()) as MarketIndicators;
    expect(payload.usedFallback).toBe(true);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildBcbSeriesUrl,
  calculateIpcaPlusSpread,
  fetchBcbSeries,
  fetchBcbSeriesLatest,
  getBcbBaseUrl,
  getDolarPtaxCompra,
  getDolarPtaxVenda,
  getEuroPtaxVenda,
  getIgpmMensal,
  getIpca12Meses,
  getIpcaMensal,
  getMarketIndicators,
  getPoupancaAnual,
  getSelicDiaria,
  getSelicMeta,
  getTaxaDi,
} from "./bcb-client";
import { BCB_SERIES_CATALOG, BCB_SERIES_IDS } from "./bcb-series";

const ORIGINAL_ENV = process.env.BCB_API_BASE_URL;
const ORIGINAL_FETCH = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("bcb-client", () => {
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
    globalThis.fetch = ORIGINAL_FETCH;
  });

  describe("getBcbBaseUrl", () => {
    it("defaults to official BCB API URL when env var is missing or blank", () => {
      expect(getBcbBaseUrl()).toBe("https://api.bcb.gov.br");
      process.env.BCB_API_BASE_URL = "   ";
      expect(getBcbBaseUrl()).toBe("https://api.bcb.gov.br");
    });

    it("uses configured BCB_API_BASE_URL and strips trailing slashes", () => {
      process.env.BCB_API_BASE_URL = "http://127.0.0.1:4100///";
      expect(getBcbBaseUrl()).toBe("http://127.0.0.1:4100");
    });
  });

  describe("buildBcbSeriesUrl", () => {
    it("builds ultimos/1 URL by default and supports custom last count", () => {
      expect(buildBcbSeriesUrl(4389)).toBe(
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.4389/dados/ultimos/1?formato=json",
      );

      process.env.BCB_API_BASE_URL = "http://127.0.0.1:4100";
      expect(buildBcbSeriesUrl(433, { last: 12 })).toBe(
        "http://127.0.0.1:4100/dados/serie/bcdata.sgs.433/dados/ultimos/12?formato=json",
      );
    });

    it("builds date-range URLs with startDate and endDate", () => {
      expect(
        buildBcbSeriesUrl(433, {
          startDate: "01/10/2026",
          endDate: "18/11/2026",
        }),
      ).toBe(
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01%2F10%2F2026&dataFinal=18%2F11%2F2026",
      );

      expect(buildBcbSeriesUrl(1, { startDate: "01/11/2026" })).toBe(
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados?formato=json&dataInicial=01%2F11%2F2026",
      );

      expect(buildBcbSeriesUrl(1, { endDate: "18/11/2026" })).toBe(
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1/dados?formato=json&dataFinal=18%2F11%2F2026",
      );
    });

    it("throws on invalid seriesId or last count", () => {
      expect(() => buildBcbSeriesUrl(0)).toThrow("Invalid BCB seriesId");
      expect(() => buildBcbSeriesUrl(-5)).toThrow("Invalid BCB seriesId");
      expect(() => buildBcbSeriesUrl(1.5)).toThrow("Invalid BCB seriesId");
      expect(() => buildBcbSeriesUrl(433, { last: 0 })).toThrow(
        "Invalid BCB last count",
      );
      expect(() => buildBcbSeriesUrl(433, { last: -1 })).toThrow(
        "Invalid BCB last count",
      );
    });
  });

  describe("fetchBcbSeries", () => {
    it("fetches and validates raw series points including optional dataFim", async () => {
      process.env.BCB_API_BASE_URL = "http://127.0.0.1:4100";
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse([
          { data: "16/11/2026", dataFim: "16/12/2026", valor: "0.6700" },
        ]),
      );
      globalThis.fetch = fetchMock;

      const points = await fetchBcbSeries(195, { last: 1 });
      expect(points).toEqual([
        { data: "16/11/2026", dataFim: "16/12/2026", valor: "0.6700" },
      ]);
      expect(fetchMock).toHaveBeenCalledWith(
        "http://127.0.0.1:4100/dados/serie/bcdata.sgs.195/dados/ultimos/1?formato=json",
        expect.objectContaining({
          method: "GET",
          cache: "no-store",
        }),
      );
    });

    it("fetches date-range queries accurately", async () => {
      const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
        jsonResponse([
          { data: "01/10/2026", valor: "0.14" },
          { data: "01/11/2026", valor: "0.21" },
        ]),
      );
      globalThis.fetch = fetchMock;

      const points = await fetchBcbSeries(433, {
        startDate: "01/10/2026",
        endDate: "18/11/2026",
      });

      expect(points).toHaveLength(2);
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=01%2F10%2F2026&dataFinal=18%2F11%2F2026",
        expect.objectContaining({ method: "GET" }),
      );
    });

    it("throws on non-OK HTTP status", async () => {
      globalThis.fetch = vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("A serie nao existe!", { status: 404 }));

      await expect(fetchBcbSeries(999999)).rejects.toThrow(
        "BCB SGS HTTP 404 for series 999999",
      );
    });

    it("throws on non-array JSON payload", async () => {
      globalThis.fetch = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse({ erro: "bad request" }));

      await expect(fetchBcbSeries(433)).rejects.toThrow(
        "BCB SGS returned non-array payload for series 433",
      );
    });

    it("throws on invalid point entries", async () => {
      const invalidPayloads: unknown[] = [
        [null],
        [{ data: "", valor: "1.0" }],
        [{ data: "18/11/2026", valor: "abc" }],
        [{ data: "18/11/2026", valor: "1.0", dataFim: 123 }],
      ];

      for (const payload of invalidPayloads) {
        globalThis.fetch = vi
          .fn<typeof fetch>()
          .mockResolvedValue(jsonResponse(payload));
        await expect(fetchBcbSeries(433)).rejects.toThrow(
          "BCB SGS returned invalid point structure for series 433",
        );
      }
    });

    it("aborts and rejects when request exceeds timeoutMs", async () => {
      globalThis.fetch = vi.fn<typeof fetch>().mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(init.signal?.reason ?? new Error("Aborted"));
            });
          }),
      );

      await expect(
        fetchBcbSeries(4389, { timeoutMs: 15 }),
      ).rejects.toThrow("BCB SGS request timed out after 15ms");
    });
  });

  describe("fetchBcbSeriesLatest", () => {
    it("returns parsed BcbIndicatorPoint on success", async () => {
      globalThis.fetch = vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          jsonResponse([{ data: "16/11/2026", valor: "13.65" }]),
        );

      const point = await fetchBcbSeriesLatest(4389, {
        name: "Taxa DI (CDI)",
        unit: "% a.a.",
        fallbackValue: 13.5,
      });

      expect(point).toEqual({
        seriesId: 4389,
        name: "Taxa DI (CDI)",
        unit: "% a.a.",
        value: 13.65,
        date: "16/11/2026",
        source: "bcb",
      });
    });

    it("falls back gracefully on empty array or fetch error", async () => {
      globalThis.fetch = vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse([]));

      const emptyFallback = await fetchBcbSeriesLatest(4389, {
        name: "Taxa DI (CDI)",
        unit: "% a.a.",
        fallbackValue: 13.65,
      });
      expect(emptyFallback).toEqual({
        seriesId: 4389,
        name: "Taxa DI (CDI)",
        unit: "% a.a.",
        value: 13.65,
        date: "18/11/2026",
        source: "fallback",
      });

      globalThis.fetch = vi
        .fn<typeof fetch>()
        .mockRejectedValue(new Error("Network error"));

      const errorFallback = await fetchBcbSeriesLatest(433, {
        name: "IPCA Mensal",
        unit: "% a.m.",
        fallbackValue: 0.14,
        fallbackDate: "01/10/2026",
      });
      expect(errorFallback).toEqual({
        seriesId: 433,
        name: "IPCA Mensal",
        unit: "% a.m.",
        value: 0.14,
        date: "01/10/2026",
        source: "fallback",
      });
    });
  });

  describe("named series helpers", () => {
    const mockSeriesMap: Record<number, { data: string; valor: string }> = {
      [BCB_SERIES_IDS.TAXA_DI]: { data: "18/11/2026", valor: "14.15" },
      [BCB_SERIES_IDS.SELIC_META]: { data: "18/11/2026", valor: "14.25" },
      [BCB_SERIES_IDS.IPCA_MENSAL]: { data: "18/11/2026", valor: "0.42" },
      [BCB_SERIES_IDS.IPCA_12M]: { data: "18/11/2026", valor: "4.50" },
      [BCB_SERIES_IDS.DOLAR_PTAX_VENDA]: { data: "18/11/2026", valor: "5.7845" },
      [BCB_SERIES_IDS.DOLAR_PTAX_COMPRA]: {
        data: "18/11/2026",
        valor: "5.7839",
      },
      [BCB_SERIES_IDS.POUPANCA_MENSAL]: { data: "18/11/2026", valor: "0.50" },
      [BCB_SERIES_IDS.SELIC_DIARIA]: { data: "18/11/2026", valor: "0.0525" },
      [BCB_SERIES_IDS.IGPM_MENSAL]: { data: "18/11/2026", valor: "0.61" },
      [BCB_SERIES_IDS.EURO_PTAX_VENDA]: { data: "18/11/2026", valor: "6.1230" },
    };

    beforeEach(() => {
      globalThis.fetch = vi.fn<typeof fetch>().mockImplementation((input) => {
        const url = String(input);
        const match = url.match(/bcdata\.sgs\.(\d+)/);
        const seriesId = match ? Number(match[1]) : -1;
        const point = mockSeriesMap[seriesId];
        if (!point) {
          return Promise.resolve(new Response("Not found", { status: 404 }));
        }
        return Promise.resolve(jsonResponse([point]));
      });
    });

    it("fetches every individual series helper accurately", async () => {
      expect((await getTaxaDi()).value).toBe(14.15);
      expect((await getSelicMeta()).value).toBe(14.25);
      expect((await getIpcaMensal()).value).toBe(0.42);
      expect((await getIpca12Meses()).value).toBe(4.5);
      expect((await getDolarPtaxVenda()).value).toBe(5.7845);
      expect((await getDolarPtaxCompra()).value).toBe(5.7839);
      expect((await getSelicDiaria()).value).toBe(0.0525);
      expect((await getIgpmMensal()).value).toBe(0.61);
      expect((await getEuroPtaxVenda()).value).toBe(6.123);

      const poupanca = await getPoupancaAnual();
      expect(poupanca).toEqual({
        seriesId: 195,
        name: "Poupança Anual",
        unit: "% a.a.",
        value: 6.17,
        date: "18/11/2026",
        source: "bcb",
      });
    });

    it("computes calculateIpcaPlusSpread with compound equivalence", () => {
      expect(calculateIpcaPlusSpread(4.5, 6)).toBe(10.77);
      expect(calculateIpcaPlusSpread(4.63)).toBe(10.91);
      expect(() => calculateIpcaPlusSpread(Number.NaN, 6)).toThrow(
        "IPCA and spread must be finite numbers",
      );
      expect(() => calculateIpcaPlusSpread(4.5, Number.POSITIVE_INFINITY)).toThrow(
        "IPCA and spread must be finite numbers",
      );
    });

    it("aggregates all indicators in getMarketIndicators without fallback when healthy", async () => {
      const indicators = await getMarketIndicators();

      expect(indicators.usedFallback).toBe(false);
      expect(indicators.selicMeta.value).toBe(14.25);
      expect(indicators.taxaDi.value).toBe(14.15);
      expect(indicators.ipcaMensal.value).toBe(0.42);
      expect(indicators.ipca12Meses.value).toBe(4.5);
      expect(indicators.dolarPtaxVenda.value).toBe(5.7845);
      expect(indicators.dolarPtaxCompra.value).toBe(5.7839);
      expect(indicators.poupancaAnual.value).toBe(6.17);
      expect(indicators.ipcaPlus6Anual).toEqual({
        seriesId: 13522,
        name: "IPCA + 6% a.a.",
        unit: "% a.a.",
        value: 10.77,
        date: "18/11/2026",
        source: "bcb",
      });
      expect(Number.isNaN(Date.parse(indicators.updatedAt))).toBe(false);
    });

    it("uses per-series fallback via Promise.allSettled when a single series fails", async () => {
      globalThis.fetch = vi.fn<typeof fetch>().mockImplementation((input) => {
        const url = String(input);
        const match = url.match(/bcdata\.sgs\.(\d+)/);
        const seriesId = match ? Number(match[1]) : -1;
        if (seriesId === BCB_SERIES_IDS.TAXA_DI) {
          return Promise.resolve(new Response("Gateway timeout", { status: 504 }));
        }
        const point = mockSeriesMap[seriesId];
        return Promise.resolve(jsonResponse([point]));
      });

      const indicators = await getMarketIndicators();

      expect(indicators.usedFallback).toBe(true);
      expect(indicators.taxaDi).toEqual({
        seriesId: 4389,
        name: BCB_SERIES_CATALOG.TAXA_DI.name,
        unit: BCB_SERIES_CATALOG.TAXA_DI.unit,
        value: BCB_SERIES_CATALOG.TAXA_DI.fallbackValue,
        date: BCB_SERIES_CATALOG.TAXA_DI.fallbackDate,
        source: "fallback",
      });
      expect(indicators.selicMeta.source).toBe("bcb");
      expect(indicators.ipcaPlus6Anual.source).toBe("bcb");
    });
  });
});

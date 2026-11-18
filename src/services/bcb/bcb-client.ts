import {
  BCB_SERIES_CATALOG,
  BCB_SERIES_IDS,
  type BcbSeriesMetadata,
} from "./bcb-series";

const DEFAULT_BCB_BASE_URL = "https://api.bcb.gov.br";
const DEFAULT_TIMEOUT_MS = 4500;
const DEFAULT_FALLBACK_DATE = "18/11/2026";

export interface BcbRawPoint {
  data: string;
  valor: string;
  dataFim?: string;
}

export interface BcbIndicatorPoint {
  seriesId: number;
  name: string;
  unit: string;
  value: number;
  date: string;
  source: "bcb" | "fallback";
}

export interface MarketIndicators {
  selicMeta: BcbIndicatorPoint;
  taxaDi: BcbIndicatorPoint;
  ipcaMensal: BcbIndicatorPoint;
  ipca12Meses: BcbIndicatorPoint;
  dolarPtaxVenda: BcbIndicatorPoint;
  dolarPtaxCompra: BcbIndicatorPoint;
  poupancaAnual: BcbIndicatorPoint;
  ipcaPlus6Anual: BcbIndicatorPoint;
  updatedAt: string;
  usedFallback: boolean;
}

export interface FetchBcbSeriesOptions {
  last?: number;
  startDate?: string;
  endDate?: string;
  timeoutMs?: number;
}

export interface FetchBcbLatestMeta {
  name: string;
  unit: string;
  fallbackValue: number;
  fallbackDate?: string;
  timeoutMs?: number;
}

class BcbHttpError extends Error {
  readonly status: number;

  constructor(status: number, seriesId: number) {
    super(`BCB SGS HTTP ${status} for series ${seriesId}`);
    this.name = "BcbHttpError";
    this.status = status;
  }
}

class BcbEmptyBodyError extends Error {
  constructor(seriesId: number) {
    super(`BCB SGS returned empty response body for series ${seriesId}`);
    this.name = "BcbEmptyBodyError";
  }
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

function annualizeMonthlyRate(monthlyPct: number): number {
  return roundTo2((Math.pow(1 + monthlyPct / 100, 12) - 1) * 100);
}

function parseBcbDateKey(dateStr: string): number {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr.trim());
  if (!match) {
    return -1;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return year * 10000 + month * 100 + day;
}

function selectLatestBcbPoint(points: BcbRawPoint[]): BcbRawPoint | undefined {
  if (points.length === 0) {
    return undefined;
  }

  let latest = points[0];
  let latestDateKey = parseBcbDateKey(latest.data);

  for (let i = 1; i < points.length; i += 1) {
    const candidate = points[i];
    const candidateDateKey = parseBcbDateKey(candidate.data);
    if (candidateDateKey >= latestDateKey) {
      latest = candidate;
      latestDateKey = candidateDateKey;
    }
  }

  return latest;
}

function isRetryableLatestError(error: unknown): boolean {
  if (error instanceof BcbHttpError) {
    return error.status === 304;
  }
  return error instanceof BcbEmptyBodyError;
}

function isBcbRawPoint(value: unknown): value is BcbRawPoint {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.data !== "string" ||
    candidate.data.trim().length === 0 ||
    typeof candidate.valor !== "string" ||
    candidate.valor.trim().length === 0
  ) {
    return false;
  }

  if (
    candidate.dataFim !== undefined &&
    typeof candidate.dataFim !== "string"
  ) {
    return false;
  }

  return Number.isFinite(Number(candidate.valor));
}

function buildFallbackPoint(
  seriesId: number,
  meta: Pick<FetchBcbLatestMeta, "name" | "unit" | "fallbackValue" | "fallbackDate">,
): BcbIndicatorPoint {
  return {
    seriesId,
    name: meta.name,
    unit: meta.unit,
    value: meta.fallbackValue,
    date: meta.fallbackDate ?? DEFAULT_FALLBACK_DATE,
    source: "fallback",
  };
}

function unwrapIndicator(
  result: PromiseSettledResult<BcbIndicatorPoint>,
  fallback: BcbIndicatorPoint,
): BcbIndicatorPoint {
  return result.status === "fulfilled" ? result.value : fallback;
}

/**
 * Returns the configured BCB SGS base URL without trailing slashes.
 */
export function getBcbBaseUrl(): string {
  const configured = process.env.BCB_API_BASE_URL?.trim();
  const baseUrl =
    configured && configured.length > 0 ? configured : DEFAULT_BCB_BASE_URL;
  return baseUrl.replace(/\/+$/, "");
}

/**
 * Builds the BCB SGS endpoint URL for either `ultimos/{N}` or a date-range query.
 */
export function buildBcbSeriesUrl(
  seriesId: number,
  options?: FetchBcbSeriesOptions,
): string {
  if (!Number.isInteger(seriesId) || seriesId <= 0) {
    throw new Error(`Invalid BCB seriesId: ${String(seriesId)}`);
  }

  const baseUrl = getBcbBaseUrl();
  const seriesPath = `${baseUrl}/dados/serie/bcdata.sgs.${seriesId}/dados`;

  if (options?.startDate || options?.endDate) {
    const params = new URLSearchParams({ formato: "json" });
    if (options.startDate) {
      params.set("dataInicial", options.startDate);
    }
    if (options.endDate) {
      params.set("dataFinal", options.endDate);
    }
    return `${seriesPath}?${params.toString()}`;
  }

  const last = options?.last ?? 1;
  if (!Number.isInteger(last) || last <= 0) {
    throw new Error(`Invalid BCB last count: ${String(last)}`);
  }

  return `${seriesPath}/ultimos/${last}?formato=json`;
}

/**
 * Fetches raw time-series points from the BCB SGS API with timeout and JSON validation.
 */
export async function fetchBcbSeries(
  seriesId: number,
  options?: FetchBcbSeriesOptions,
): Promise<BcbRawPoint[]> {
  const url = buildBcbSeriesUrl(seriesId, options);
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => {
    controller.abort(
      new Error(`BCB SGS request timed out after ${timeoutMs}ms`),
    );
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new BcbHttpError(response.status, seriesId);
    }

    const rawBody = await response.text();
    if (rawBody.trim().length === 0) {
      throw new BcbEmptyBodyError(seriesId);
    }

    const payload: unknown = JSON.parse(rawBody);
    if (!Array.isArray(payload)) {
      throw new Error(
        `BCB SGS returned non-array payload for series ${seriesId}`,
      );
    }

    const points: BcbRawPoint[] = [];
    for (const item of payload) {
      if (!isBcbRawPoint(item)) {
        throw new Error(
          `BCB SGS returned invalid point structure for series ${seriesId}`,
        );
      }
      points.push(item);
    }

    return points;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function fetchLatestPointsWithRetry(
  seriesId: number,
  timeoutMs?: number,
): Promise<BcbRawPoint[]> {
  try {
    return await fetchBcbSeries(seriesId, {
      last: 1,
      timeoutMs,
    });
  } catch (error) {
    if (!isRetryableLatestError(error)) {
      throw error;
    }

    // BCB's Azure Front Door CDN can return HTTP 304 / empty body on ultimos/1;
    // retrying once with ultimos/2 bypasses the poisoned cache key.
    return fetchBcbSeries(seriesId, {
      last: 2,
      timeoutMs,
    });
  }
}

/**
 * Fetches the latest point of a BCB SGS series, returning a structured fallback on error.
 */
export async function fetchBcbSeriesLatest(
  seriesId: number,
  meta: FetchBcbLatestMeta,
): Promise<BcbIndicatorPoint> {
  try {
    const points = await fetchLatestPointsWithRetry(seriesId, meta.timeoutMs);

    const latest = selectLatestBcbPoint(points);
    if (!latest) {
      throw new Error(`BCB SGS returned empty array for series ${seriesId}`);
    }

    return {
      seriesId,
      name: meta.name,
      unit: meta.unit,
      value: Number(latest.valor),
      date: latest.data,
      source: "bcb",
    };
  } catch {
    return buildFallbackPoint(seriesId, meta);
  }
}

function fetchCatalogLatest(
  metadata: BcbSeriesMetadata,
): Promise<BcbIndicatorPoint> {
  return fetchBcbSeriesLatest(metadata.id, {
    name: metadata.name,
    unit: metadata.unit,
    fallbackValue: metadata.fallbackValue,
    fallbackDate: metadata.fallbackDate,
  });
}

export function getTaxaDi(): Promise<BcbIndicatorPoint> {
  return fetchCatalogLatest(BCB_SERIES_CATALOG.TAXA_DI);
}

export function getSelicMeta(): Promise<BcbIndicatorPoint> {
  return fetchCatalogLatest(BCB_SERIES_CATALOG.SELIC_META);
}

export function getIpcaMensal(): Promise<BcbIndicatorPoint> {
  return fetchCatalogLatest(BCB_SERIES_CATALOG.IPCA_MENSAL);
}

export function getIpca12Meses(): Promise<BcbIndicatorPoint> {
  return fetchCatalogLatest(BCB_SERIES_CATALOG.IPCA_12M);
}

export function getDolarPtaxVenda(): Promise<BcbIndicatorPoint> {
  return fetchCatalogLatest(BCB_SERIES_CATALOG.DOLAR_PTAX_VENDA);
}

export function getDolarPtaxCompra(): Promise<BcbIndicatorPoint> {
  return fetchCatalogLatest(BCB_SERIES_CATALOG.DOLAR_PTAX_COMPRA);
}

/**
 * Fetches the monthly Poupança rate (series 195) and annualizes it to `% a.a.`.
 */
export async function getPoupancaAnual(): Promise<BcbIndicatorPoint> {
  const monthlyPoint = await fetchCatalogLatest(
    BCB_SERIES_CATALOG.POUPANCA_MENSAL,
  );
  return {
    ...monthlyPoint,
    name: "Poupança Anual",
    unit: "% a.a.",
    value: annualizeMonthlyRate(monthlyPoint.value),
  };
}

export function getSelicDiaria(): Promise<BcbIndicatorPoint> {
  return fetchCatalogLatest(BCB_SERIES_CATALOG.SELIC_DIARIA);
}

export function getIgpmMensal(): Promise<BcbIndicatorPoint> {
  return fetchCatalogLatest(BCB_SERIES_CATALOG.IGPM_MENSAL);
}

export function getEuroPtaxVenda(): Promise<BcbIndicatorPoint> {
  return fetchCatalogLatest(BCB_SERIES_CATALOG.EURO_PTAX_VENDA);
}

/**
 * Computes compound equivalent annual rate for IPCA + fixed spread:
 * `((1 + ipca12m / 100) * (1 + spreadPct / 100) - 1) * 100`.
 */
export function calculateIpcaPlusSpread(
  ipca12m: number,
  spreadPct = 6,
): number {
  if (!Number.isFinite(ipca12m) || !Number.isFinite(spreadPct)) {
    throw new Error("IPCA and spread must be finite numbers");
  }

  const annualFactor = (1 + ipca12m / 100) * (1 + spreadPct / 100) - 1;
  return roundTo2(annualFactor * 100);
}

/**
 * Fetches all primary market indicators in parallel with per-series resilience.
 */
export async function getMarketIndicators(): Promise<MarketIndicators> {
  const [
    selicMetaResult,
    taxaDiResult,
    ipcaMensalResult,
    ipca12MesesResult,
    dolarVendaResult,
    dolarCompraResult,
    poupancaResult,
  ] = await Promise.allSettled([
    getSelicMeta(),
    getTaxaDi(),
    getIpcaMensal(),
    getIpca12Meses(),
    getDolarPtaxVenda(),
    getDolarPtaxCompra(),
    getPoupancaAnual(),
  ]);

  const selicMeta = unwrapIndicator(
    selicMetaResult,
    buildFallbackPoint(
      BCB_SERIES_CATALOG.SELIC_META.id,
      BCB_SERIES_CATALOG.SELIC_META,
    ),
  );
  const taxaDi = unwrapIndicator(
    taxaDiResult,
    buildFallbackPoint(
      BCB_SERIES_CATALOG.TAXA_DI.id,
      BCB_SERIES_CATALOG.TAXA_DI,
    ),
  );
  const ipcaMensal = unwrapIndicator(
    ipcaMensalResult,
    buildFallbackPoint(
      BCB_SERIES_CATALOG.IPCA_MENSAL.id,
      BCB_SERIES_CATALOG.IPCA_MENSAL,
    ),
  );
  const ipca12Meses = unwrapIndicator(
    ipca12MesesResult,
    buildFallbackPoint(
      BCB_SERIES_CATALOG.IPCA_12M.id,
      BCB_SERIES_CATALOG.IPCA_12M,
    ),
  );
  const dolarPtaxVenda = unwrapIndicator(
    dolarVendaResult,
    buildFallbackPoint(
      BCB_SERIES_CATALOG.DOLAR_PTAX_VENDA.id,
      BCB_SERIES_CATALOG.DOLAR_PTAX_VENDA,
    ),
  );
  const dolarPtaxCompra = unwrapIndicator(
    dolarCompraResult,
    buildFallbackPoint(
      BCB_SERIES_CATALOG.DOLAR_PTAX_COMPRA.id,
      BCB_SERIES_CATALOG.DOLAR_PTAX_COMPRA,
    ),
  );
  const poupancaAnual = unwrapIndicator(poupancaResult, {
    seriesId: BCB_SERIES_CATALOG.POUPANCA_MENSAL.id,
    name: "Poupança Anual",
    unit: "% a.a.",
    value: annualizeMonthlyRate(
      BCB_SERIES_CATALOG.POUPANCA_MENSAL.fallbackValue,
    ),
    date: BCB_SERIES_CATALOG.POUPANCA_MENSAL.fallbackDate,
    source: "fallback",
  });

  const ipcaPlus6Anual: BcbIndicatorPoint = {
    seriesId: BCB_SERIES_IDS.IPCA_12M,
    name: "IPCA + 6% a.a.",
    unit: "% a.a.",
    value: calculateIpcaPlusSpread(ipca12Meses.value, 6),
    date: ipca12Meses.date,
    source: ipca12Meses.source,
  };

  const usedFallback = [
    selicMeta,
    taxaDi,
    ipcaMensal,
    ipca12Meses,
    dolarPtaxVenda,
    dolarPtaxCompra,
    poupancaAnual,
  ].some((indicator) => indicator.source === "fallback");

  return {
    selicMeta,
    taxaDi,
    ipcaMensal,
    ipca12Meses,
    dolarPtaxVenda,
    dolarPtaxCompra,
    poupancaAnual,
    ipcaPlus6Anual,
    updatedAt: new Date().toISOString(),
    usedFallback,
  };
}

/**
 * Catalog of Banco Central do Brasil (BCB) SGS time-series IDs, metadata,
 * and conservative fallback values observed from the live SGS API.
 */

export type BcbSeriesPeriodicity = "daily" | "monthly" | "event";

export interface BcbSeriesMetadata {
  readonly id: number;
  readonly name: string;
  readonly unit: string;
  readonly periodicity: BcbSeriesPeriodicity;
  readonly fallbackValue: number;
  readonly fallbackDate: string;
}

export const BCB_SERIES_IDS = {
  TAXA_DI: 4389,
  SELIC_META: 432,
  IPCA_MENSAL: 433,
  IPCA_12M: 13522,
  DOLAR_PTAX_VENDA: 1,
  DOLAR_PTAX_COMPRA: 10813,
  POUPANCA_MENSAL: 195,
  SELIC_DIARIA: 11,
  IGPM_MENSAL: 189,
  EURO_PTAX_VENDA: 21619,
} as const;

export type BcbSeriesKey = keyof typeof BCB_SERIES_IDS;

export const BCB_SERIES_CATALOG: Record<BcbSeriesKey, BcbSeriesMetadata> = {
  TAXA_DI: {
    id: BCB_SERIES_IDS.TAXA_DI,
    name: "Taxa DI (CDI)",
    unit: "% a.a.",
    periodicity: "daily",
    fallbackValue: 13.65,
    fallbackDate: "16/11/2026",
  },
  SELIC_META: {
    id: BCB_SERIES_IDS.SELIC_META,
    name: "Taxa Selic Meta",
    unit: "% a.a.",
    periodicity: "daily",
    fallbackValue: 13.75,
    fallbackDate: "09/12/2026",
  },
  IPCA_MENSAL: {
    id: BCB_SERIES_IDS.IPCA_MENSAL,
    name: "IPCA Mensal",
    unit: "% a.m.",
    periodicity: "monthly",
    fallbackValue: 0.14,
    fallbackDate: "01/10/2026",
  },
  IPCA_12M: {
    id: BCB_SERIES_IDS.IPCA_12M,
    name: "IPCA Acumulado 12m",
    unit: "% a.a.",
    periodicity: "monthly",
    fallbackValue: 4.63,
    fallbackDate: "01/10/2026",
  },
  DOLAR_PTAX_VENDA: {
    id: BCB_SERIES_IDS.DOLAR_PTAX_VENDA,
    name: "Dólar PTAX Venda",
    unit: "R$",
    periodicity: "daily",
    fallbackValue: 5.7851,
    fallbackDate: "17/11/2026",
  },
  DOLAR_PTAX_COMPRA: {
    id: BCB_SERIES_IDS.DOLAR_PTAX_COMPRA,
    name: "Dólar PTAX Compra",
    unit: "R$",
    periodicity: "daily",
    fallbackValue: 5.7845,
    fallbackDate: "17/11/2026",
  },
  POUPANCA_MENSAL: {
    id: BCB_SERIES_IDS.POUPANCA_MENSAL,
    name: "Poupança Mensal",
    unit: "% a.m.",
    periodicity: "daily",
    fallbackValue: 0.67,
    fallbackDate: "16/11/2026",
  },
  SELIC_DIARIA: {
    id: BCB_SERIES_IDS.SELIC_DIARIA,
    name: "Taxa Selic Diária",
    unit: "% a.d.",
    periodicity: "daily",
    fallbackValue: 0.050788,
    fallbackDate: "17/11/2026",
  },
  IGPM_MENSAL: {
    id: BCB_SERIES_IDS.IGPM_MENSAL,
    name: "IGP-M Mensal",
    unit: "% a.m.",
    periodicity: "monthly",
    fallbackValue: 1.47,
    fallbackDate: "01/10/2026",
  },
  EURO_PTAX_VENDA: {
    id: BCB_SERIES_IDS.EURO_PTAX_VENDA,
    name: "Euro PTAX Venda",
    unit: "R$",
    periodicity: "daily",
    fallbackValue: 6.3659,
    fallbackDate: "17/11/2026",
  },
};

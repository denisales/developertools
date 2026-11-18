import type { MarketIndicators } from "@/services/bcb/bcb-client";

export type RatePeriodUnit = "month" | "year";
export type TimePeriodUnit = "months" | "years";

export interface CompoundInterestInput {
  initialValue: number; // R$
  monthlyContribution: number; // R$
  interestRate: number; // % (ex: 12 para 12%)
  rateUnit: RatePeriodUnit; // 'month' | 'year'
  period: number; // ex: 10
  periodUnit: TimePeriodUnit; // 'months' | 'years'
}

export interface EvolutionRow {
  month: number;
  year: number;
  periodInterest: number;
  totalInvested: number;
  totalInterest: number;
  totalAmount: number;
}

export interface CompoundInterestResult {
  finalAmount: number;
  totalInvested: number;
  totalInterest: number;
  investedPercentage: number;
  interestPercentage: number;
  effectiveMonthlyRate: number;
  effectiveAnnualRate: number;
  totalMonths: number;
  monthlyEvolution: EvolutionRow[];
  yearlyEvolution: EvolutionRow[];
}

export interface CompoundInterestPreset {
  id: string;
  label: string;
  description: string;
  rate: number;
  rateUnit: RatePeriodUnit;
  badge: string;
}

export const COMPOUND_INTEREST_PRESETS: CompoundInterestPreset[] = [
  {
    id: "selic",
    label: "Tesouro Selic",
    description: "Referência da taxa básica de juros no Brasil",
    rate: 14.25,
    rateUnit: "year",
    badge: "14,25% a.a.",
  },
  {
    id: "cdi-100",
    label: "100% do CDI",
    description: "CDBs de liquidez diária e contas remuneradas",
    rate: 14.15,
    rateUnit: "year",
    badge: "14,15% a.a.",
  },
  {
    id: "ipca-plus",
    label: "Tesouro IPCA+ 6%",
    description: "Taxa híbrida estimada (IPCA ~4,5% + 6% real)",
    rate: 10.77,
    rateUnit: "year",
    badge: "10,77% a.a.",
  },
  {
    id: "carteira-1",
    label: "1% ao Mês",
    description: "Meta clássica do investidor de longo prazo",
    rate: 1.0,
    rateUnit: "month",
    badge: "1,00% a.m.",
  },
  {
    id: "poupanca",
    label: "Poupança",
    description: "Rendimento aproximado de 0,5% a.m. + TR",
    rate: 6.17,
    rateUnit: "year",
    badge: "6,17% a.a.",
  },
];

export const DEFAULT_COMPOUND_INTEREST_INPUT: CompoundInterestInput = {
  initialValue: 1000,
  monthlyContribution: 500,
  interestRate: 14.15,
  rateUnit: "year",
  period: 10,
  periodUnit: "years",
};

/**
 * Arredonda um valor numérico para 2 casas decimais (centavos) com segurança contra imprecisão IEEE-754.
 */
export function roundCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Converte taxa de juros informada (% mensal ou % anual) para taxa efetiva mensal decimal (i_m).
 * Segue rigorosamente a fórmula de equivalência composta:
 * - Mensal: i_m = r
 * - Anual:  i_m = (1 + r)^(1/12) - 1
 */
export function toEffectiveMonthlyRate(
  interestRatePercent: number,
  rateUnit: RatePeriodUnit
): number {
  const safeRate = Math.max(0, Number.isFinite(interestRatePercent) ? interestRatePercent : 0);
  const r = safeRate / 100;
  if (rateUnit === "month") {
    return r;
  }
  return Math.pow(1 + r, 1 / 12) - 1;
}

/**
 * Converte a taxa efetiva mensal decimal (i_m) para taxa efetiva anual decimal (i_a).
 * i_a = (1 + i_m)^12 - 1
 */
export function toEffectiveAnnualRate(effectiveMonthlyRate: number): number {
  if (!Number.isFinite(effectiveMonthlyRate) || effectiveMonthlyRate <= 0) return 0;
  return Math.pow(1 + effectiveMonthlyRate, 12) - 1;
}

/**
 * Converte o período informado para total de meses inteiros (N).
 * Limita a 1200 meses (100 anos) para evitar travamento de memória em entradas extremas.
 */
export function toTotalMonths(period: number, periodUnit: TimePeriodUnit): number {
  const safePeriod = Math.max(0, Number.isFinite(period) ? period : 0);
  const rawMonths =
    periodUnit === "years" ? Math.round(safePeriod * 12) : Math.round(safePeriod);
  return Math.min(Math.max(0, rawMonths), 1200);
}

/**
 * Calcula os Juros Compostos mês a mês com capitalização composta exata.
 */
export function calculateCompoundInterest(
  input: CompoundInterestInput
): CompoundInterestResult {
  const initialValue = Math.max(
    0,
    Number.isFinite(input.initialValue) ? input.initialValue : 0
  );
  const monthlyContribution = Math.max(
    0,
    Number.isFinite(input.monthlyContribution) ? input.monthlyContribution : 0
  );
  const effectiveMonthlyRate = toEffectiveMonthlyRate(
    input.interestRate,
    input.rateUnit
  );
  const effectiveAnnualRate = toEffectiveAnnualRate(effectiveMonthlyRate);
  const totalMonths = toTotalMonths(input.period, input.periodUnit);

  const monthlyEvolution: EvolutionRow[] = [];

  let currentBalance = initialValue;
  let cumulativeInvested = initialValue;
  let cumulativeInterest = 0;

  // Estado Inicial (Mês 0)
  monthlyEvolution.push({
    month: 0,
    year: 0,
    periodInterest: 0,
    totalInvested: roundCents(initialValue),
    totalInterest: 0,
    totalAmount: roundCents(initialValue),
  });

  // Iteração Mês 1 até Mês N
  for (let m = 1; m <= totalMonths; m++) {
    const periodInterest = currentBalance * effectiveMonthlyRate;
    currentBalance = currentBalance + periodInterest + monthlyContribution;
    cumulativeInvested = initialValue + m * monthlyContribution;
    cumulativeInterest = currentBalance - cumulativeInvested;

    monthlyEvolution.push({
      month: m,
      year: Math.ceil(m / 12),
      periodInterest: roundCents(periodInterest),
      totalInvested: roundCents(cumulativeInvested),
      totalInterest: roundCents(cumulativeInterest),
      totalAmount: roundCents(currentBalance),
    });
  }

  // Agrupamento Anual para gráficos de longo prazo e visão anual da tabela
  const yearlyEvolution: EvolutionRow[] = [monthlyEvolution[0]];
  if (totalMonths > 0) {
    let previousInterestTotal = 0;
    for (let m = 1; m <= totalMonths; m++) {
      if (m % 12 === 0 || m === totalMonths) {
        const row = monthlyEvolution[m];
        const yearSliceInterest = roundCents(row.totalInterest - previousInterestTotal);
        previousInterestTotal = row.totalInterest;
        yearlyEvolution.push({
          month: row.month,
          year: Math.ceil(m / 12),
          periodInterest: yearSliceInterest,
          totalInvested: row.totalInvested,
          totalInterest: row.totalInterest,
          totalAmount: row.totalAmount,
        });
      }
    }
  }

  const finalRow = monthlyEvolution[monthlyEvolution.length - 1];
  const finalAmount = finalRow.totalAmount;
  const totalInvested = finalRow.totalInvested;
  const totalInterest = finalRow.totalInterest;

  const investedPercentage =
    finalAmount > 0 ? roundCents((totalInvested / finalAmount) * 100) : 100;
  const interestPercentage =
    finalAmount > 0 ? roundCents(100 - investedPercentage) : 0;

  return {
    finalAmount,
    totalInvested,
    totalInterest,
    investedPercentage,
    interestPercentage,
    effectiveMonthlyRate,
    effectiveAnnualRate,
    totalMonths,
    monthlyEvolution,
    yearlyEvolution,
  };
}

/**
 * Fórmula fechada equivalente de Valor Futuro (FV) com aportes postecipados (para validação e testes de sanidade).
 */
export function calculateClosedFormFutureValue(
  input: CompoundInterestInput
): {
  finalAmount: number;
  totalInvested: number;
  totalInterest: number;
} {
  const P0 = Math.max(0, input.initialValue);
  const PMT = Math.max(0, input.monthlyContribution);
  const im = toEffectiveMonthlyRate(input.interestRate, input.rateUnit);
  const N = toTotalMonths(input.period, input.periodUnit);

  const totalInvested = P0 + PMT * N;
  let fv = totalInvested;

  if (im > 0 && N > 0) {
    const compoundFactor = Math.pow(1 + im, N);
    fv = P0 * compoundFactor + PMT * ((compoundFactor - 1) / im);
  }

  const finalAmount = roundCents(fv);
  const roundedInvested = roundCents(totalInvested);
  const totalInterest = roundCents(finalAmount - roundedInvested);

  return {
    finalAmount,
    totalInvested: roundedInvested,
    totalInterest,
  };
}

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formata um número em moeda Real Brasileiro (R$ #.##0,00).
 */
export function formatCurrencyBRL(value: number): string {
  return brlFormatter.format(Number.isFinite(value) ? value : 0);
}

/**
 * Formata um número em padrão decimal PT-BR (#.##0,00) sem o prefixo R$.
 */
export function formatDecimalBR(value: number): string {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

/**
 * Formata valores monetários de forma compacta para eixos de gráficos (ex: R$ 15 mil, R$ 1,2 mi).
 */
export function formatCompactBRL(value: number): string {
  if (!Number.isFinite(value)) return "R$ 0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `R$ ${(value / 1_000_000_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} bi`;
  }
  if (abs >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mi`;
  }
  if (abs >= 1_000) {
    return `R$ ${(value / 1_000).toLocaleString("pt-BR", {
      maximumFractionDigits: 1,
    })} mil`;
  }
  return `R$ ${Math.round(value).toLocaleString("pt-BR")}`;
}

/**
 * Converte string digitada em input de máscara monetária para número em reais (centavos / 100).
 */
export function parseCurrencyInputBR(rawValue: string): number {
  const digitsOnly = rawValue.replace(/\D/g, "");
  if (!digitsOnly) return 0;
  const parsed = Number.parseInt(digitsOnly, 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(parsed / 100, 999_999_999.99);
}

/**
 * Gera conteúdo CSV compatível com Excel/Google Sheets (separado por ponto-e-vírgula) da tabela de evolução.
 */
export function generateEvolutionCsv(
  rows: EvolutionRow[],
  mode: "monthly" | "yearly"
): string {
  const header = [
    mode === "monthly" ? "Mês" : "Ano",
    "Juros no Período (R$)",
    "Total Investido (R$)",
    "Total em Juros (R$)",
    "Total Acumulado (R$)",
  ].join(";");

  const lines = rows.map((row) =>
    [
      mode === "monthly" ? row.month : row.year,
      formatDecimalBR(row.periodInterest),
      formatDecimalBR(row.totalInvested),
      formatDecimalBR(row.totalInterest),
      formatDecimalBR(row.totalAmount),
    ].join(";")
  );

  return [header, ...lines].join("\n");
}

function isValidIndicatorPoint(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.value === "number" &&
    Number.isFinite(candidate.value) &&
    typeof candidate.date === "string"
  );
}

/**
 * Valida em tempo de execução o payload JSON retornado por `/api/indicators`.
 */
export function isMarketIndicators(value: unknown): value is MarketIndicators {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    isValidIndicatorPoint(candidate.selicMeta) &&
    isValidIndicatorPoint(candidate.taxaDi) &&
    isValidIndicatorPoint(candidate.ipca12Meses) &&
    isValidIndicatorPoint(candidate.dolarPtaxVenda) &&
    isValidIndicatorPoint(candidate.poupancaAnual) &&
    isValidIndicatorPoint(candidate.ipcaPlus6Anual)
  );
}

/**
 * Formata uma taxa percentual com 2 casas decimais em padrão PT-BR (`14,25`).
 */
export function formatRatePtBr(value: number): string {
  const safe = Number.isFinite(value) ? value : 0;
  return safe.toFixed(2).replace(".", ",");
}

/**
 * Constrói a lista de presets da calculadora a partir dos indicadores dinâmicos do BCB,
 * mantendo os valores padrão estáticos como fallback quando indisponível.
 */
export function buildPresetsFromIndicators(
  indicators?: MarketIndicators | null
): CompoundInterestPreset[] {
  if (!indicators) {
    return COMPOUND_INTEREST_PRESETS;
  }

  const selicRate = indicators.selicMeta.value;
  const diRate = indicators.taxaDi.value;
  const ipcaPlus6Rate = indicators.ipcaPlus6Anual.value;
  const ipca12mRate = indicators.ipca12Meses.value;
  const poupancaRate = indicators.poupancaAnual.value;

  return [
    {
      id: "selic",
      label: "Tesouro Selic",
      description: `Taxa Selic Meta BCB (Ref. ${indicators.selicMeta.date})`,
      rate: selicRate,
      rateUnit: "year",
      badge: `${formatRatePtBr(selicRate)}% a.a.`,
    },
    {
      id: "cdi-100",
      label: "100% do CDI",
      description: `Taxa DI anualizada BCB (Ref. ${indicators.taxaDi.date})`,
      rate: diRate,
      rateUnit: "year",
      badge: `${formatRatePtBr(diRate)}% a.a.`,
    },
    {
      id: "ipca-plus",
      label: "Tesouro IPCA+ 6%",
      description: `IPCA 12m (${formatRatePtBr(ipca12mRate)}%) + 6% a.a. real (Ref. ${indicators.ipca12Meses.date})`,
      rate: ipcaPlus6Rate,
      rateUnit: "year",
      badge: `${formatRatePtBr(ipcaPlus6Rate)}% a.a.`,
    },
    {
      id: "carteira-1",
      label: "1% ao Mês",
      description: "Meta clássica do investidor de longo prazo",
      rate: 1.0,
      rateUnit: "month",
      badge: "1,00% a.m.",
    },
    {
      id: "poupanca",
      label: "Poupança",
      description: `Rendimento anualizado da Poupança BCB (Ref. ${indicators.poupancaAnual.date})`,
      rate: poupancaRate,
      rateUnit: "year",
      badge: `${formatRatePtBr(poupancaRate)}% a.a.`,
    },
  ];
}

/**
 * Formata o rótulo compacto exibido no botão de preset da barra horizontal.
 */
export function formatPresetChipLabel(preset: CompoundInterestPreset): string {
  const formatted = formatRatePtBr(preset.rate);
  switch (preset.id) {
    case "selic":
      return `Selic ${formatted}%`;
    case "cdi-100":
      return `CDI ${formatted}%`;
    case "ipca-plus":
      return `IPCA+ ${formatted}%`;
    case "carteira-1":
      return "1% a.m.";
    case "poupanca":
      return `Poupança ${formatted}%`;
    default:
      return `${preset.label} ${preset.badge}`;
  }
}

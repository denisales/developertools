import { describe, expect, it } from "vitest";
import type { MarketIndicators } from "@/services/bcb/bcb-client";
import {
  COMPOUND_INTEREST_PRESETS,
  DEFAULT_COMPOUND_INTEREST_INPUT,
  buildPresetsFromIndicators,
  calculateClosedFormFutureValue,
  calculateCompoundInterest,
  formatCompactBRL,
  formatCurrencyBRL,
  formatDecimalBR,
  formatPresetChipLabel,
  formatRatePtBr,
  generateEvolutionCsv,
  isMarketIndicators,
  parseCurrencyInputBR,
  roundCents,
  toEffectiveAnnualRate,
  toEffectiveMonthlyRate,
  toTotalMonths,
  type CompoundInterestPreset,
  type EvolutionRow,
} from "./compound-interest-utils";

describe("compound-interest-utils", () => {
  describe("presets and defaults", () => {
    it("exposes expected presets with valid structure", () => {
      expect(COMPOUND_INTEREST_PRESETS).toHaveLength(5);
      const ids = COMPOUND_INTEREST_PRESETS.map((p) => p.id);
      expect(ids).toEqual([
        "selic",
        "cdi-100",
        "ipca-plus",
        "carteira-1",
        "poupanca",
      ]);

      for (const preset of COMPOUND_INTEREST_PRESETS) {
        expect(preset.label.length).toBeGreaterThan(0);
        expect(preset.description.length).toBeGreaterThan(0);
        expect(preset.rate).toBeGreaterThan(0);
        expect(["month", "year"]).toContain(preset.rateUnit);
        expect(preset.badge.length).toBeGreaterThan(0);
      }
    });

    it("exposes expected default input", () => {
      expect(DEFAULT_COMPOUND_INTEREST_INPUT).toEqual({
        initialValue: 1000,
        monthlyContribution: 500,
        interestRate: 14.15,
        rateUnit: "year",
        period: 10,
        periodUnit: "years",
      });
    });
  });

  describe("roundCents", () => {
    it("rounds finite values to two decimal places", () => {
      expect(roundCents(10.005)).toBe(10.01);
      expect(roundCents(123.454)).toBe(123.45);
      expect(roundCents(0)).toBe(0);
    });

    it("returns 0 for non-finite values", () => {
      expect(roundCents(Number.NaN)).toBe(0);
      expect(roundCents(Number.POSITIVE_INFINITY)).toBe(0);
      expect(roundCents(Number.NEGATIVE_INFINITY)).toBe(0);
    });
  });

  describe("rate and period conversions", () => {
    it("converts annual and monthly rates using exact exponential equivalence", () => {
      const monthlyRate12 = toEffectiveMonthlyRate(12, "year");
      const expected = Math.pow(1.12, 1 / 12) - 1;
      expect(monthlyRate12).toBeCloseTo(expected, 12);

      expect(toEffectiveMonthlyRate(1.5, "month")).toBeCloseTo(0.015, 12);
      expect(toEffectiveMonthlyRate(-5, "year")).toBe(0);
      expect(toEffectiveMonthlyRate(Number.NaN, "month")).toBe(0);
    });

    it("converts effective monthly rate to annual rate and handles edge values", () => {
      const monthly = toEffectiveMonthlyRate(12, "year");
      expect(toEffectiveAnnualRate(monthly)).toBeCloseTo(0.12, 10);
      expect(toEffectiveAnnualRate(0.01)).toBeCloseTo(
        Math.pow(1.01, 12) - 1,
        12
      );
      expect(toEffectiveAnnualRate(0)).toBe(0);
      expect(toEffectiveAnnualRate(-0.02)).toBe(0);
      expect(toEffectiveAnnualRate(Number.NaN)).toBe(0);
    });

    it("converts period to total months and clamps between 0 and 1200", () => {
      expect(toTotalMonths(5, "years")).toBe(60);
      expect(toTotalMonths(18, "months")).toBe(18);
      expect(toTotalMonths(1.5, "years")).toBe(18);
      expect(toTotalMonths(-10, "months")).toBe(0);
      expect(toTotalMonths(Number.POSITIVE_INFINITY, "years")).toBe(0);
      expect(toTotalMonths(150, "years")).toBe(1200);
      expect(toTotalMonths(2000, "months")).toBe(1200);
    });
  });

  describe("calculateCompoundInterest", () => {
    it("matches golden scenario 1: annual rate over 1 year", () => {
      const input = {
        initialValue: 1000,
        monthlyContribution: 500,
        interestRate: 12,
        rateUnit: "year" as const,
        period: 1,
        periodUnit: "years" as const,
      };
      const result = calculateCompoundInterest(input);
      const closed = calculateClosedFormFutureValue(input);

      expect(result.totalMonths).toBe(12);
      expect(result.totalInvested).toBe(7000);
      expect(result.finalAmount).toBe(7443.25);
      expect(result.totalInterest).toBe(443.25);
      expect(result.finalAmount).toBe(closed.finalAmount);
      expect(result.totalInvested).toBe(closed.totalInvested);
      expect(result.totalInterest).toBe(closed.totalInterest);
      expect(result.monthlyEvolution[0].totalAmount).toBe(1000);
      expect(result.monthlyEvolution[1].periodInterest).toBe(9.49);
      expect(result.monthlyEvolution[1].totalAmount).toBe(1509.49);
      expect(result.yearlyEvolution).toHaveLength(2);
      expect(result.yearlyEvolution[1]).toEqual({
        month: 12,
        year: 1,
        periodInterest: 443.25,
        totalInvested: 7000,
        totalInterest: 443.25,
        totalAmount: 7443.25,
      });
    });

    it("matches golden scenario 2: monthly rate over 12 months", () => {
      const result = calculateCompoundInterest({
        initialValue: 10000,
        monthlyContribution: 1000,
        interestRate: 1,
        rateUnit: "month",
        period: 12,
        periodUnit: "months",
      });

      expect(result.totalMonths).toBe(12);
      expect(result.totalInvested).toBe(22000);
      expect(result.finalAmount).toBe(23950.75);
      expect(result.totalInterest).toBe(1950.75);
      expect(result.investedPercentage + result.interestPercentage).toBeCloseTo(
        100,
        2
      );
    });

    it("handles 0% interest rate", () => {
      const result = calculateCompoundInterest({
        initialValue: 2000,
        monthlyContribution: 300,
        interestRate: 0,
        rateUnit: "year",
        period: 10,
        periodUnit: "months",
      });
      const closed = calculateClosedFormFutureValue({
        initialValue: 2000,
        monthlyContribution: 300,
        interestRate: 0,
        rateUnit: "year",
        period: 10,
        periodUnit: "months",
      });

      expect(result.finalAmount).toBe(5000);
      expect(result.totalInvested).toBe(5000);
      expect(result.totalInterest).toBe(0);
      expect(result.investedPercentage).toBe(100);
      expect(result.interestPercentage).toBe(0);
      expect(closed.finalAmount).toBe(5000);
    });

    it("handles 0 initial value with monthly contributions", () => {
      const result = calculateCompoundInterest({
        initialValue: 0,
        monthlyContribution: 500,
        interestRate: 1,
        rateUnit: "month",
        period: 6,
        periodUnit: "months",
      });

      expect(result.monthlyEvolution[0].totalAmount).toBe(0);
      expect(result.totalInvested).toBe(3000);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.finalAmount).toBe(
        roundCents(result.totalInvested + result.totalInterest)
      );
    });

    it("handles 0 monthly contribution with initial value only", () => {
      const result = calculateCompoundInterest({
        initialValue: 10000,
        monthlyContribution: 0,
        interestRate: 1,
        rateUnit: "month",
        period: 12,
        periodUnit: "months",
      });

      expect(result.totalInvested).toBe(10000);
      expect(result.finalAmount).toBe(roundCents(10000 * Math.pow(1.01, 12)));
      expect(result.totalInterest).toBe(
        roundCents(result.finalAmount - result.totalInvested)
      );
    });

    it("groups yearly evolution including partial final year when totalMonths is not a multiple of 12", () => {
      const result = calculateCompoundInterest({
        initialValue: 1000,
        monthlyContribution: 200,
        interestRate: 12,
        rateUnit: "year",
        period: 18,
        periodUnit: "months",
      });

      expect(result.yearlyEvolution).toHaveLength(3);
      expect(result.yearlyEvolution.map((r) => r.month)).toEqual([0, 12, 18]);
      expect(result.yearlyEvolution.map((r) => r.year)).toEqual([0, 1, 2]);
      const sumYearlyInterest =
        result.yearlyEvolution[1].periodInterest +
        result.yearlyEvolution[2].periodInterest;
      expect(sumYearlyInterest).toBeCloseTo(result.totalInterest, 2);
    });

    it("handles zero period and non-finite inputs safely", () => {
      const zeroPeriod = calculateCompoundInterest({
        initialValue: Number.NaN,
        monthlyContribution: Number.POSITIVE_INFINITY,
        interestRate: 10,
        rateUnit: "year",
        period: 0,
        periodUnit: "months",
      });

      expect(zeroPeriod.totalMonths).toBe(0);
      expect(zeroPeriod.finalAmount).toBe(0);
      expect(zeroPeriod.totalInvested).toBe(0);
      expect(zeroPeriod.totalInterest).toBe(0);
      expect(zeroPeriod.investedPercentage).toBe(100);
      expect(zeroPeriod.interestPercentage).toBe(0);
      expect(zeroPeriod.monthlyEvolution).toHaveLength(1);
      expect(zeroPeriod.yearlyEvolution).toHaveLength(1);
    });
  });

  describe("formatting and parsing helpers", () => {
    it("formats currency and decimals in pt-BR", () => {
      const formattedCurrency = formatCurrencyBRL(23950.75);
      expect(formattedCurrency).toContain("R$");
      expect(formattedCurrency).toContain("23.950,75");
      expect(formatCurrencyBRL(Number.NaN)).toContain("0,00");

      expect(formatDecimalBR(1234.5)).toBe("1.234,50");
      expect(formatDecimalBR(Number.POSITIVE_INFINITY)).toBe("0,00");
    });

    it("formats compact BRL across all magnitude thresholds", () => {
      expect(formatCompactBRL(Number.NaN)).toBe("R$ 0");
      expect(formatCompactBRL(500)).toBe("R$ 500");
      expect(formatCompactBRL(15_400)).toBe("R$ 15,4 mil");
      expect(formatCompactBRL(1_250_000)).toBe("R$ 1,3 mi");
      expect(formatCompactBRL(2_500_000_000)).toBe("R$ 2,5 bi");
    });

    it("parses currency mask input in cents and clamps max value", () => {
      expect(parseCurrencyInputBR("")).toBe(0);
      expect(parseCurrencyInputBR("abc")).toBe(0);
      expect(parseCurrencyInputBR("R$ 1.250,50")).toBe(1250.5);
      expect(parseCurrencyInputBR("00050")).toBe(0.5);
      expect(parseCurrencyInputBR("999999999999999")).toBe(999_999_999.99);
    });

    it("generates CSV for both monthly and yearly modes", () => {
      const rows: EvolutionRow[] = [
        {
          month: 0,
          year: 0,
          periodInterest: 0,
          totalInvested: 1000,
          totalInterest: 0,
          totalAmount: 1000,
        },
        {
          month: 12,
          year: 1,
          periodInterest: 120.5,
          totalInvested: 7000,
          totalInterest: 120.5,
          totalAmount: 7120.5,
        },
      ];

      const monthlyCsv = generateEvolutionCsv(rows, "monthly");
      const monthlyLines = monthlyCsv.split("\n");
      expect(monthlyLines[0]).toBe(
        "Mês;Juros no Período (R$);Total Investido (R$);Total em Juros (R$);Total Acumulado (R$)"
      );
      expect(monthlyLines[1]).toBe("0;0,00;1.000,00;0,00;1.000,00");
      expect(monthlyLines[2]).toBe("12;120,50;7.000,00;120,50;7.120,50");

      const yearlyCsv = generateEvolutionCsv(rows, "yearly");
      const yearlyLines = yearlyCsv.split("\n");
      expect(yearlyLines[0]).toBe(
        "Ano;Juros no Período (R$);Total Investido (R$);Total em Juros (R$);Total Acumulado (R$)"
      );
      expect(yearlyLines[2]).toBe("1;120,50;7.000,00;120,50;7.120,50");
    });
  });

  describe("dynamic BCB indicator helpers", () => {
    const sampleIndicators: MarketIndicators = {
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

    it("validates MarketIndicators runtime payloads", () => {
      expect(isMarketIndicators(sampleIndicators)).toBe(true);
      expect(isMarketIndicators(null)).toBe(false);
      expect(isMarketIndicators("invalid")).toBe(false);
      expect(
        isMarketIndicators({
          ...sampleIndicators,
          selicMeta: null,
        })
      ).toBe(false);
      expect(
        isMarketIndicators({
          ...sampleIndicators,
          taxaDi: { value: "14.15", date: "18/11/2026" },
        })
      ).toBe(false);
    });

    it("formats PT-BR rates and builds presets from dynamic BCB indicators", () => {
      expect(formatRatePtBr(14.25)).toBe("14,25");
      expect(formatRatePtBr(Number.NaN)).toBe("0,00");

      expect(buildPresetsFromIndicators(null)).toBe(COMPOUND_INTEREST_PRESETS);

      const dynamicPresets = buildPresetsFromIndicators({
        ...sampleIndicators,
        selicMeta: { ...sampleIndicators.selicMeta, value: 15.0 },
        taxaDi: { ...sampleIndicators.taxaDi, value: 14.9 },
        ipcaPlus6Anual: { ...sampleIndicators.ipcaPlus6Anual, value: 11.2 },
        poupancaAnual: { ...sampleIndicators.poupancaAnual, value: 7.45 },
      });

      expect(dynamicPresets.map((p) => p.rate)).toEqual([
        15.0,
        14.9,
        11.2,
        1.0,
        7.45,
      ]);
      expect(dynamicPresets.map(formatPresetChipLabel)).toEqual([
        "Selic 15,00%",
        "CDI 14,90%",
        "IPCA+ 11,20%",
        "1% a.m.",
        "Poupança 7,45%",
      ]);

      const customPreset: CompoundInterestPreset = {
        id: "custom",
        label: "Custom",
        description: "Taxa personalizada",
        rate: 8.5,
        rateUnit: "year",
        badge: "8,50% a.a.",
      };
      expect(formatPresetChipLabel(customPreset)).toBe("Custom 8,50% a.a.");
    });
  });
});

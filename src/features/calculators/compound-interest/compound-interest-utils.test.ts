import {
  calculateClosedFormFutureValue,
  calculateCompoundInterest,
  formatCurrencyBRL,
  parseCurrencyInputBR,
  toEffectiveMonthlyRate,
  toTotalMonths,
} from "./compound-interest-utils";

/**
 * Executa a suíte de validação matemática da Calculadora de Juros Compostos (Golden Tests).
 * Pode ser invocada em testes automatizados ou validação de sanidade.
 */
export function runCompoundInterestGoldenTests(): {
  passed: boolean;
  details: string[];
} {
  const details: string[] = [];

  // 1. Equivalência exponencial exata: (1 + 0.12)^(1/12) - 1
  const monthlyRate12 = toEffectiveMonthlyRate(12, "year");
  const expectedMonthlyRate12 = Math.pow(1.12, 1 / 12) - 1;
  if (Math.abs(monthlyRate12 - expectedMonthlyRate12) > 1e-12) {
    throw new Error(
      `Falha na conversão exponencial de taxa: obtido ${monthlyRate12}, esperado ${expectedMonthlyRate12}`
    );
  }
  details.push(
    `Taxa 12% a.a. -> ${(monthlyRate12 * 100).toFixed(6)}% a.m. (OK)`
  );

  // 2. Cenário 1: R$ 1.000 inicial + R$ 500/mês @ 12% Anual por 1 Ano (12 meses)
  const scenario1 = calculateCompoundInterest({
    initialValue: 1000,
    monthlyContribution: 500,
    interestRate: 12,
    rateUnit: "year",
    period: 1,
    periodUnit: "years",
  });
  const closed1 = calculateClosedFormFutureValue({
    initialValue: 1000,
    monthlyContribution: 500,
    interestRate: 12,
    rateUnit: "year",
    period: 1,
    periodUnit: "years",
  });

  if (
    scenario1.totalMonths !== 12 ||
    scenario1.totalInvested !== 7000.0 ||
    scenario1.finalAmount !== 7443.25 ||
    scenario1.totalInterest !== 443.25 ||
    scenario1.finalAmount !== closed1.finalAmount ||
    scenario1.monthlyEvolution[0].totalAmount !== 1000.0 ||
    scenario1.monthlyEvolution[1].periodInterest !== 9.49 ||
    scenario1.monthlyEvolution[1].totalAmount !== 1509.49
  ) {
    throw new Error(
      `Falha no Cenário 1: ${JSON.stringify({
        finalAmount: scenario1.finalAmount,
        totalInvested: scenario1.totalInvested,
        totalInterest: scenario1.totalInterest,
      })}`
    );
  }
  details.push(
    `Cenário 1 (12% a.a., 1 ano): Investido R$ 7.000,00 | Final R$ 7.443,25 | Juros R$ 443,25 (OK)`
  );

  // 3. Cenário 2: R$ 10.000 inicial + R$ 1.000/mês @ 1% Mensal por 12 Meses
  const scenario2 = calculateCompoundInterest({
    initialValue: 10000,
    monthlyContribution: 1000,
    interestRate: 1,
    rateUnit: "month",
    period: 12,
    periodUnit: "months",
  });

  if (
    scenario2.totalMonths !== 12 ||
    scenario2.totalInvested !== 22000.0 ||
    scenario2.finalAmount !== 23950.75 ||
    scenario2.totalInterest !== 1950.75
  ) {
    throw new Error(
      `Falha no Cenário 2: ${JSON.stringify({
        finalAmount: scenario2.finalAmount,
        totalInvested: scenario2.totalInvested,
        totalInterest: scenario2.totalInterest,
      })}`
    );
  }
  details.push(
    `Cenário 2 (1% a.m., 12 meses): Investido R$ 22.000,00 | Final R$ 23.950,75 | Juros R$ 1.950,75 (OK)`
  );

  // 4. Casos de borda (taxa zero e utilitários de moeda)
  const zeroRate = calculateCompoundInterest({
    initialValue: 2000,
    monthlyContribution: 300,
    interestRate: 0,
    rateUnit: "year",
    period: 10,
    periodUnit: "months",
  });
  if (
    zeroRate.finalAmount !== 5000 ||
    zeroRate.totalInterest !== 0 ||
    toTotalMonths(5, "years") !== 60 ||
    parseCurrencyInputBR("R$ 1.250,50") !== 1250.5 ||
    !formatCurrencyBRL(23950.75).includes("23.950,75")
  ) {
    throw new Error("Falha nos testes de borda e formatação BRL");
  }
  details.push("Testes de borda e máscara monetária BRL (OK)");

  return { passed: true, details };
}

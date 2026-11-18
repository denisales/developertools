import * as React from "react";
import type { Metadata } from "next";
import { CompoundInterestFeature } from "@/features/calculators/compound-interest";
import { CompoundInterestSkeleton } from "@/features/calculators/compound-interest/compound-interest-skeleton";
import { getMarketIndicators } from "@/services/bcb/bcb-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Calculadora de Juros Compostos Online | DevToolsBR",
  description:
    "Simule rendimentos de juros compostos com valor inicial, aportes mensais, taxa mensal ou anual, gráfico evolutivo e tabela mês a mês.",
};

async function CompoundInterestServer() {
  const indicators = await getMarketIndicators();
  return <CompoundInterestFeature initialIndicators={indicators} />;
}

export default function CalculadoraJurosCompostosPage() {
  return (
    <React.Suspense fallback={<CompoundInterestSkeleton />}>
      <CompoundInterestServer />
    </React.Suspense>
  );
}

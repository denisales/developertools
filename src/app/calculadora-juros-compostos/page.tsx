import type { Metadata } from "next";
import { CompoundInterestFeature } from "@/features/calculators/compound-interest";

export const metadata: Metadata = {
  title: "Calculadora de Juros Compostos Online | DevToolsBR",
  description:
    "Simule rendimentos de juros compostos com valor inicial, aportes mensais, taxa mensal ou anual, gráfico evolutivo e tabela mês a mês.",
};

export default function CalculadoraJurosCompostosPage() {
  return <CompoundInterestFeature />;
}

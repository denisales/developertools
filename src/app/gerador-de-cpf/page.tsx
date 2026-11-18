import type { Metadata } from "next";
import { CpfGeneratorFeature } from "@/features/generators/cpf";

export const metadata: Metadata = {
  title: "Gerador e Validador de CPF Online | DevToolsBR (4Devs)",
  description:
    "Gere números de CPF válidos com ou sem pontuação, escolha o estado de origem (UF), gere CPFs em lote e valide CPFs pelo algoritmo Módulo 11.",
};

export default function GeradorDeCpfPage() {
  return <CpfGeneratorFeature />;
}

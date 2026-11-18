import type { Metadata } from "next";
import { CnpjGeneratorFeature } from "@/features/generators/cnpj";

export const metadata: Metadata = {
  title: "Gerador e Validador de CNPJ Online | DevToolsBR (4Devs)",
  description:
    "Gere números de CNPJ válidos (numéricos e alfanuméricos), escolha matriz ou filial, gere em lote e valide CNPJs instantaneamente.",
};

export default function GeradorDeCnpjPage() {
  return <CnpjGeneratorFeature />;
}

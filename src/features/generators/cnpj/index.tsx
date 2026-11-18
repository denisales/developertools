"use client";

import * as React from "react";
import { Building2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CnpjGeneratorFeature() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Gerador e Validador de CNPJ
              </h1>
              <p className="text-sm text-muted-foreground">
                Gere CNPJs tradicionais ou alfanuméricos válidos, escolha matriz
                ou filial e valide dígitos verificadores.
              </p>
            </div>
          </div>
        </div>
        <Badge variant="default" className="w-fit">
          Numérico & Alfanumérico
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerador de CNPJ</CardTitle>
          <CardDescription>
            Módulo isolado em{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              src/features/generators/cnpj/
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Carregando interface do Gerador e Validador de CNPJ...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CnpjGeneratorFeature;

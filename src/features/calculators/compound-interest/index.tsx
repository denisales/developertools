"use client";

import * as React from "react";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CompoundInterestFeature() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Calculadora de Juros Compostos
              </h1>
              <p className="text-sm text-muted-foreground">
                Simule investimentos com aportes mensais, gráfico de evolução
                patrimonial e tabela detalhada.
              </p>
            </div>
          </div>
        </div>
        <Badge variant="default" className="w-fit">
          Padrão Investidor10
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Simulador de Juros Compostos</CardTitle>
          <CardDescription>
            Módulo isolado em{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              src/features/calculators/compound-interest/
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Carregando simulador financeiro de Juros Compostos...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CompoundInterestFeature;

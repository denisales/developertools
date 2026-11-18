"use client";

import * as React from "react";
import { Fingerprint } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function CpfGeneratorFeature() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Fingerprint className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Gerador e Validador de CPF
              </h1>
              <p className="text-sm text-muted-foreground">
                Gere números de CPF válidos pelo Módulo 11, filtre por UF de
                origem ou valide CPFs existentes.
              </p>
            </div>
          </div>
        </div>
        <Badge variant="default" className="w-fit">
          Módulo 11 Oficial
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gerador de CPF</CardTitle>
          <CardDescription>
            Módulo isolado em{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              src/features/generators/cpf/
            </code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Carregando interface do Gerador e Validador de CPF...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default CpfGeneratorFeature;

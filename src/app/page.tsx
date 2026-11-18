"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Search,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  TOOL_CATEGORIES,
  TOOLS_REGISTRY,
  getPriorityTools,
  type ToolCategory,
} from "@/config/tools-registry";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToolIcon } from "@/components/layout/tool-icon";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const [query, setQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<
    ToolCategory | "all"
  >("all");

  const priorityTools = getPriorityTools();

  const q = query.trim().toLowerCase();
  const filteredTools = TOOLS_REGISTRY.filter((tool) => {
    const matchesCategory =
      selectedCategory === "all" || tool.category === selectedCategory;
    const matchesQuery =
      !q ||
      tool.name.toLowerCase().includes(q) ||
      tool.shortName.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.keywords.some((k) => k.toLowerCase().includes(q));
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="w-full space-y-4 sm:space-y-6 pb-8">
      {/* Ferramentas Principais em Destaque (Prioridade #1 Above the Fold no Mobile) */}
      {!query && selectedCategory === "all" && (
        <section className="space-y-2.5 sm:space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-7 sm:size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-3.5 sm:size-4" />
              </div>
              <div>
                <h2 className="text-base font-bold tracking-tight sm:text-xl">
                  Ferramentas Ativas
                </h2>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Acesso direto às ferramentas completas de geração, validação e simulação
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              Acesso imediato
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:gap-4 md:grid-cols-3">
            {priorityTools.map((tool) => (
              <Card
                key={tool.id}
                className="group relative flex flex-col justify-between gap-2.5 border-primary/25 bg-gradient-to-b from-card to-accent/20 py-3 sm:py-5 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-sm"
              >
                <CardHeader className="min-w-0 space-y-1.5 px-3.5 sm:px-5 pb-0">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <div className="flex size-8 sm:size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
                        <ToolIcon name={tool.iconName} className="size-4 sm:size-5" />
                      </div>
                      <CardTitle className="truncate text-sm sm:text-lg font-bold group-hover:text-primary transition-colors">
                        {tool.name}
                      </CardTitle>
                    </div>
                    <Badge variant="default" className="shrink-0 gap-1 text-xs">
                      <CheckCircle2 className="size-3" />
                      <span>{tool.badge ?? "Ativo"}</span>
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 text-xs sm:text-sm leading-snug sm:leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="px-3.5 sm:px-5 pt-0.5">
                  <Button asChild className="h-9 sm:h-10 w-full justify-between text-xs sm:text-sm">
                    <Link href={tool.href}>
                      <span>Abrir Ferramenta</span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Compact Hero & Filter Banner */}
      <section className="relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-primary/10 via-background to-accent/40 p-4 sm:p-6 shadow-2xs">
        <div className="max-w-3xl space-y-2.5 sm:space-y-3.5">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/90 px-2.5 py-0.5 text-xs font-semibold text-primary shadow-2xs">
            <Zap className="size-3.5" />
            <span>Rápido, Prático e Gratuito</span>
          </div>
          <h1 className="text-xl font-extrabold tracking-tight sm:text-3xl leading-tight">
            Geradores, Validadores &{" "}
            <span className="text-primary">Calculadoras Financeiras</span>
          </h1>
          <p className="text-xs leading-relaxed text-muted-foreground sm:text-base">
            Gere CPFs e CNPJs válidos para testes de software, valide documentos
            ou simule a evolução dos seus investimentos com juros compostos.
          </p>

          {/* Hero Filter Input & Category Pills */}
          <div className="flex flex-col gap-2.5 pt-0.5">
            <div className="relative max-w-lg">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar ferramentas (ex: CPF, CNPJ, Juros, Cartão, RG)..."
                className="h-9 sm:h-10 rounded-lg bg-background pr-9 pl-10 text-xs sm:text-sm shadow-2xs"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Limpar filtro"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar sm:flex-wrap sm:overflow-visible sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-background/90 text-muted-foreground hover:text-foreground border border-border/80"
                )}
              >
                Todas ({TOOLS_REGISTRY.length})
              </button>
              {TOOL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-2xs"
                      : "bg-background/90 text-muted-foreground hover:text-foreground border border-border/80"
                  )}
                >
                  {cat.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo Completo por Categoria */}
      <section className="space-y-5 sm:space-y-6">
        {TOOL_CATEGORIES.map((category) => {
          const categoryTools = filteredTools.filter(
            (t) => t.category === category.id
          );
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="space-y-3">
              <div className="border-b border-border/80 pb-2">
                <h2 className="text-base font-bold tracking-tight sm:text-xl">
                  {category.label}
                </h2>
                <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">
                  {category.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoryTools.map((tool) => {
                  const isReady = tool.status === "ready";
                  return (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      className="group block h-full"
                    >
                      <Card
                        className={cn(
                          "h-full justify-between gap-2 py-3.5 sm:py-4 transition-all hover:border-primary/60 hover:shadow-xs",
                          !isReady && "opacity-85"
                        )}
                      >
                        <CardHeader className="min-w-0 px-3.5 sm:px-4 py-0">
                          <div className="flex min-w-0 items-start justify-between gap-2">
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              <div
                                className={cn(
                                  "flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg",
                                  isReady
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                <ToolIcon
                                  name={tool.iconName}
                                  className="size-4"
                                />
                              </div>
                              <CardTitle className="truncate text-sm sm:text-base font-bold group-hover:text-primary transition-colors">
                                {tool.name}
                              </CardTitle>
                            </div>
                            <Badge
                              variant={isReady ? "default" : "secondary"}
                              className="shrink-0 text-xs"
                            >
                              {isReady ? "Disponível" : "Catálogo"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="px-3.5 sm:px-4 py-0">
                          <p className="line-clamp-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                            {tool.description}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filteredTools.length === 0 && (
          <div className="rounded-xl border border-dashed p-6 sm:p-8 text-center space-y-3">
            <p className="text-sm font-semibold">
              Nenhuma ferramenta encontrada para o filtro selecionado.
            </p>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setQuery("");
                setSelectedCategory("all");
              }}
            >
              Limpar filtros
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

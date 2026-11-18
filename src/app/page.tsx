"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Search,
  Sparkles,
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
    <div className="space-y-10 pb-10">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-accent/40 p-6 sm:p-8">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border bg-background/80 px-3 py-1 text-xs font-medium text-primary shadow-2xs">
            <Zap className="size-3.5" />
            <span>Rápido, Mobile-First e 100% Client-Side</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
            Geradores, Validadores &{" "}
            <span className="text-primary">Calculadoras Financeiras</span>
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            Inspirado no <strong>4Devs</strong> e no{" "}
            <strong>Investidor10</strong>. Gere CPFs e CNPJs válidos para testes
            de software ou simule rendimentos de juros compostos com precisão
            matemática no computador ou celular.
          </p>

          {/* Hero Filter Input */}
          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar ferramentas (ex: CPF, CNPJ, Juros, Cartão, RG)..."
                className="h-11 rounded-xl bg-background pl-10 text-sm shadow-xs"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-background/80 text-muted-foreground hover:text-foreground border"
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
                    "rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-background/80 text-muted-foreground hover:text-foreground border"
                  )}
                >
                  {cat.shortLabel}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Destaques / Mais Acessados */}
      {!query && selectedCategory === "all" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                Ferramentas Principais em Destaque
              </h2>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Prontas para uso imediato
            </Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {priorityTools.map((tool) => (
              <Card
                key={tool.id}
                className="group relative flex flex-col justify-between border-primary/25 bg-gradient-to-b from-card to-accent/20 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                      <ToolIcon name={tool.iconName} className="size-5" />
                    </div>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle2 className="size-3" />
                      <span>{tool.badge ?? "Ativo"}</span>
                    </Badge>
                  </div>
                  <CardTitle className="pt-3 text-lg group-hover:text-primary transition-colors">
                    {tool.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 text-xs sm:text-sm">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                  <Button asChild className="w-full justify-between" size="sm">
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

      {/* Catálogo Completo por Categoria */}
      <section className="space-y-8">
        {TOOL_CATEGORIES.map((category) => {
          const categoryTools = filteredTools.filter(
            (t) => t.category === category.id
          );
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="space-y-4">
              <div className="border-b pb-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {category.label}
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {category.description}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                          "h-full gap-3 py-4 transition-all hover:border-primary/60 hover:shadow-xs",
                          !isReady && "opacity-80"
                        )}
                      >
                        <CardHeader className="px-4 py-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div
                                className={cn(
                                  "flex size-9 shrink-0 items-center justify-center rounded-lg",
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
                              <CardTitle className="text-sm font-semibold group-hover:text-primary transition-colors">
                                {tool.name}
                              </CardTitle>
                            </div>
                            <Badge
                              variant={isReady ? "default" : "outline"}
                              className="shrink-0 text-[10px]"
                            >
                              {isReady ? "Disponível" : "Catálogo"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 py-0">
                          <p className="line-clamp-2 text-xs text-muted-foreground">
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
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium">
              Nenhuma ferramenta encontrada para o filtro selecionado.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
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

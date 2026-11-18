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
    <div className="space-y-12 pb-12">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-br from-primary/10 via-background to-accent/40 p-7 sm:p-10 lg:p-12 shadow-xs">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/90 px-4 py-1.5 text-xs font-semibold text-primary shadow-2xs">
            <Zap className="size-4" />
            <span>Rápido, Mobile-First e 100% Client-Side</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
            Geradores, Validadores &{" "}
            <span className="text-primary">Calculadoras Financeiras</span>
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            Inspirado no <strong className="text-foreground font-semibold">4Devs</strong> e no{" "}
            <strong className="text-foreground font-semibold">Investidor10</strong>. Gere CPFs e CNPJs válidos para testes
            de software ou simule rendimentos de juros compostos com precisão
            matemática no computador ou celular.
          </p>

          {/* Hero Filter Input & Category Pills */}
          <div className="flex flex-col gap-4 pt-2">
            <div className="relative max-w-xl">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filtrar ferramentas (ex: CPF, CNPJ, Juros, Cartão, RG)..."
                className="h-12 rounded-xl bg-background pl-11 text-sm sm:text-base shadow-xs"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                  selectedCategory === "all"
                    ? "bg-primary text-primary-foreground shadow-xs"
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
                    "rounded-xl px-4 py-2 text-sm font-semibold transition-all cursor-pointer",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-xs"
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

      {/* Destaques / Mais Acessados */}
      {!query && selectedCategory === "all" && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Ferramentas Principais em Destaque
                </h2>
                <p className="text-sm text-muted-foreground">
                  Acesso direto às ferramentas completas de geração, validação e simulação
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">
              Prontas para uso imediato
            </Badge>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {priorityTools.map((tool) => (
              <Card
                key={tool.id}
                className="group relative flex flex-col justify-between border-primary/25 bg-gradient-to-b from-card to-accent/20 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <CardHeader className="space-y-3 pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
                      <ToolIcon name={tool.iconName} className="size-6" />
                    </div>
                    <Badge variant="default" className="gap-1.5">
                      <CheckCircle2 className="size-3.5" />
                      <span>{tool.badge ?? "Ativo"}</span>
                    </Badge>
                  </div>
                  <CardTitle className="pt-2 text-xl group-hover:text-primary transition-colors">
                    {tool.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2">
                  <Button asChild className="w-full justify-between" size="default">
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
      <section className="space-y-12">
        {TOOL_CATEGORIES.map((category) => {
          const categoryTools = filteredTools.filter(
            (t) => t.category === category.id
          );
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id} className="space-y-6">
              <div className="border-b border-border/80 pb-4">
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  {category.label}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                  {category.description}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
                          "h-full justify-between gap-4 py-6 transition-all hover:border-primary/60 hover:shadow-sm",
                          !isReady && "opacity-85"
                        )}
                      >
                        <CardHeader className="px-6 py-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={cn(
                                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                                  isReady
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                <ToolIcon
                                  name={tool.iconName}
                                  className="size-5"
                                />
                              </div>
                              <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">
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
                        <CardContent className="px-6 py-0">
                          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
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
          <div className="rounded-2xl border border-dashed p-12 text-center space-y-4">
            <p className="text-base font-semibold">
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

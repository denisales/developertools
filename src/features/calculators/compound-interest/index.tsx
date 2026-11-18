"use client";

import * as React from "react";
import {
  TrendingUp,
  Calculator,
  RotateCcw,
  Download,
  Copy,
  Check,
  Sparkles,
  PiggyBank,
  Coins,
  Wallet,
  BarChart3,
  PieChart as PieChartIcon,
  Table as TableIcon,
  BookOpen,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

import {
  COMPOUND_INTEREST_PRESETS,
  DEFAULT_COMPOUND_INTEREST_INPUT,
  calculateCompoundInterest,
  formatCompactBRL,
  formatCurrencyBRL,
  formatDecimalBR,
  generateEvolutionCsv,
  parseCurrencyInputBR,
  type CompoundInterestPreset,
  type EvolutionRow,
  type RatePeriodUnit,
  type TimePeriodUnit,
} from "./compound-interest-utils";

export function CompoundInterestFeature() {
  // Estados dos inputs financeiros
  const [initialValue, setInitialValue] = React.useState<number>(
    DEFAULT_COMPOUND_INTEREST_INPUT.initialValue
  );
  const [monthlyContribution, setMonthlyContribution] = React.useState<number>(
    DEFAULT_COMPOUND_INTEREST_INPUT.monthlyContribution
  );
  const [rateText, setRateText] = React.useState<string>("10,00");
  const [rateUnit, setRateUnit] = React.useState<RatePeriodUnit>(
    DEFAULT_COMPOUND_INTEREST_INPUT.rateUnit
  );
  const [periodText, setPeriodText] = React.useState<string>("10");
  const [periodUnit, setPeriodUnit] = React.useState<TimePeriodUnit>(
    DEFAULT_COMPOUND_INTEREST_INPUT.periodUnit
  );

  // Estado de visualização de gráfico e tabela
  const [tableMode, setTableMode] = React.useState<"monthly" | "yearly">(
    "monthly"
  );
  const [showAllMonths, setShowAllMonths] = React.useState<boolean>(false);
  const [activeChartIndex, setActiveChartIndex] = React.useState<number | null>(
    null
  );
  const [copiedSummary, setCopiedSummary] = React.useState<boolean>(false);

  const parsedRate = React.useMemo(() => {
    const normalized = rateText.replace(",", ".").replace(/[^\d.]/g, "");
    const num = Number.parseFloat(normalized);
    return Number.isFinite(num) && num >= 0 ? Math.min(num, 10000) : 0;
  }, [rateText]);

  const parsedPeriod = React.useMemo(() => {
    const normalized = periodText.replace(",", ".").replace(/[^\d.]/g, "");
    const num = Number.parseFloat(normalized);
    return Number.isFinite(num) && num >= 0 ? Math.min(num, 1200) : 0;
  }, [periodText]);

  const result = React.useMemo(() => {
    return calculateCompoundInterest({
      initialValue,
      monthlyContribution,
      interestRate: parsedRate,
      rateUnit,
      period: parsedPeriod,
      periodUnit,
    });
  }, [
    initialValue,
    monthlyContribution,
    parsedRate,
    rateUnit,
    parsedPeriod,
    periodUnit,
  ]);

  // Pontos exibidos no gráfico de evolução (agrupa por ano se > 36 meses para leitura limpa no mobile/desktop)
  const chartRows = React.useMemo<EvolutionRow[]>(() => {
    const source =
      result.totalMonths > 36 && result.yearlyEvolution.length > 2
        ? result.yearlyEvolution
        : result.monthlyEvolution;

    if (source.length <= 25) return source;

    // Amostragem uniforme preservando início e fim se houver muitos pontos
    const step = Math.ceil((source.length - 1) / 24);
    const sampled: EvolutionRow[] = [];
    for (let i = 0; i < source.length; i += step) {
      sampled.push(source[i]);
    }
    if (sampled[sampled.length - 1]?.month !== source[source.length - 1]?.month) {
      sampled.push(source[source.length - 1]);
    }
    return sampled;
  }, [result]);

  const chartUsesYears =
    result.totalMonths > 36 && result.yearlyEvolution.length > 2;

  const inspectedRow = React.useMemo<EvolutionRow>(() => {
    if (
      activeChartIndex !== null &&
      chartRows[activeChartIndex] !== undefined
    ) {
      return chartRows[activeChartIndex];
    }
    return chartRows[chartRows.length - 1] ?? result.monthlyEvolution[0];
  }, [activeChartIndex, chartRows, result.monthlyEvolution]);

  const handleApplyPreset = (preset: CompoundInterestPreset) => {
    setRateText(preset.rate.toFixed(2).replace(".", ","));
    setRateUnit(preset.rateUnit);
    toast.success(`Taxa ajustada para ${preset.label} (${preset.badge})`);
  };

  const handleClear = () => {
    setInitialValue(0);
    setMonthlyContribution(0);
    setRateText("0,00");
    setPeriodText("1");
    setActiveChartIndex(null);
    toast.info("Campos limpos. Insira novos valores para simular.");
  };

  const handleResetDefaults = () => {
    setInitialValue(DEFAULT_COMPOUND_INTEREST_INPUT.initialValue);
    setMonthlyContribution(DEFAULT_COMPOUND_INTEREST_INPUT.monthlyContribution);
    setRateText("10,00");
    setRateUnit("year");
    setPeriodText("10");
    setPeriodUnit("years");
    setActiveChartIndex(null);
    toast.success("Valores padrão restaurados.");
  };

  const handleCopySummary = async () => {
    const text = [
      "📊 Simulação de Juros Compostos — DevToolsBR",
      `• Valor Inicial: ${formatCurrencyBRL(initialValue)}`,
      `• Aporte Mensal: ${formatCurrencyBRL(monthlyContribution)}`,
      `• Taxa de Juros: ${rateText}% (${rateUnit === "year" ? "ao ano" : "ao mês"})`,
      `• Período: ${result.totalMonths} meses (${(result.totalMonths / 12).toFixed(1).replace(".0", "")} anos)`,
      "────────────────────────────",
      `💰 Valor Total Final: ${formatCurrencyBRL(result.finalAmount)}`,
      `📥 Total Investido: ${formatCurrencyBRL(result.totalInvested)} (${result.investedPercentage.toFixed(1)}%)`,
      `📈 Total em Juros: ${formatCurrencyBRL(result.totalInterest)} (${result.interestPercentage.toFixed(1)}%)`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedSummary(true);
      toast.success("Resumo da simulação copiado para a área de transferência!");
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o resumo automaticamente.");
    }
  };

  const handleDownloadCsv = () => {
    const rows =
      tableMode === "monthly" ? result.monthlyEvolution : result.yearlyEvolution;
    const csv = generateEvolutionCsv(rows, tableMode);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `juros-compostos-${tableMode}-${result.totalMonths}m.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Planilha CSV exportada com sucesso!");
  };

  // Cálculo do gráfico de rosca (Donut SVG)
  const donutRadius = 62;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const interestArcLength =
    (result.interestPercentage / 100) * donutCircumference;
  const investedArcLength = donutCircumference - interestArcLength;

  // Linhas da tabela ativa
  const activeTableRows =
    tableMode === "monthly" ? result.monthlyEvolution : result.yearlyEvolution;
  const visibleTableRows =
    tableMode === "monthly" && !showAllMonths && activeTableRows.length > 25
      ? activeTableRows.slice(0, 25)
      : activeTableRows;

  const multiplier =
    result.totalInvested > 0 ? result.finalAmount / result.totalInvested : 1;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* Cabeçalho da Ferramenta */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="size-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Calculadora de Juros Compostos
              </h1>
              <Badge
                variant="secondary"
                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              >
                Motor Investidor10
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Simule a evolução do seu patrimônio com aportes mensais, equivalência
              exata de taxas, gráficos interativos e tabela mês a mês.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="gap-1.5"
          >
            {copiedSummary ? (
              <Check className="size-4 text-emerald-500" />
            ) : (
              <Copy className="size-4" />
            )}
            {copiedSummary ? "Copiado" : "Copiar Resumo"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetDefaults}
            className="text-xs text-muted-foreground"
          >
             Exemplo Padrão
          </Button>
        </div>
      </div>

      {/* Presets Rápidos de Indexadores Brasileiros */}
      <div className="rounded-xl border bg-card/60 p-3.5 shadow-2xs">
        <div className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-amber-500" />
          <span>Preencher com taxas de referência do mercado:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {COMPOUND_INTEREST_PRESETS.map((preset) => {
            const isSelected =
              Math.abs(parsedRate - preset.rate) < 0.005 &&
              rateUnit === preset.rateUnit;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                title={preset.description}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                    : "border-border bg-background hover:bg-muted/80 text-foreground"
                }`}
              >
                <span>{preset.label}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Formulário de Simulação (#feesCompostosForm) */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calculator className="size-5 text-primary" />
            Parâmetros da Simulação
          </CardTitle>
          <CardDescription>
            Preencha os campos abaixo. O cálculo é atualizado instantaneamente a
            cada alteração.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            id="feesCompostosForm"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Simulação de juros compostos atualizada!");
            }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Campo 1: Valor Inicial */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="mainValue" className="text-sm font-semibold">
                    Valor Inicial
                  </Label>
                  <div className="flex gap-1">
                    {[1000, 5000, 10000].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setInitialValue((prev) => prev + inc)}
                        className="rounded border bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                      >
                        +{inc >= 1000 ? `${inc / 1000}k` : inc}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="mainValue"
                    type="text"
                    inputMode="numeric"
                    value={formatDecimalBR(initialValue)}
                    onChange={(e) =>
                      setInitialValue(parseCurrencyInputBR(e.target.value))
                    }
                    className="h-11 pl-10 font-mono text-base font-medium"
                    placeholder="0,00"
                    aria-label="Valor Inicial em Reais"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Montante aplicado no momento zero (Mês 0).
                </p>
              </div>

              {/* Campo 2: Valor Mensal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="investment" className="text-sm font-semibold">
                    Valor Mensal (Aporte)
                  </Label>
                  <div className="flex gap-1">
                    {[200, 500, 1000].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() =>
                          setMonthlyContribution((prev) => prev + inc)
                        }
                        className="rounded border bg-muted/50 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                      >
                        +{inc >= 1000 ? `${inc / 1000}k` : inc}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="investment"
                    type="text"
                    inputMode="numeric"
                    value={formatDecimalBR(monthlyContribution)}
                    onChange={(e) =>
                      setMonthlyContribution(parseCurrencyInputBR(e.target.value))
                    }
                    className="h-11 pl-10 font-mono text-base font-medium"
                    placeholder="0,00"
                    aria-label="Valor Mensal em Reais"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Valor somado todos os meses após o rendimento mensal.
                </p>
              </div>

              {/* Campo 3: Taxa de Juros */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="rate" className="text-sm font-semibold">
                    Taxa de Juros
                  </Label>
                  <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                    {rateUnit === "year"
                      ? `≈ ${(result.effectiveMonthlyRate * 100).toFixed(4).replace(".", ",")}% ao mês`
                      : `≈ ${(result.effectiveAnnualRate * 100).toFixed(2).replace(".", ",")}% ao ano`}
                  </span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-medium text-muted-foreground">
                      %
                    </span>
                    <Input
                      id="rate"
                      type="text"
                      inputMode="decimal"
                      value={rateText}
                      onChange={(e) => setRateText(e.target.value)}
                      className="h-11 pl-9 font-mono text-base font-medium"
                      placeholder="10,00"
                      aria-label="Taxa de Juros"
                    />
                  </div>
                  <Select
                    value={rateUnit}
                    onValueChange={(val) => setRateUnit(val as RatePeriodUnit)}
                  >
                    <SelectTrigger
                      id="select-rate"
                      className="h-11 w-[130px] shrink-0 font-medium"
                      aria-label="Unidade da Taxa de Juros"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year">Anual</SelectItem>
                      <SelectItem value="month">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Conversão composta exata: <code className="text-[11px]">(1 + i_a)^(1/12) - 1</code>.
                </p>
              </div>

              {/* Campo 4: Período */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="period" className="text-sm font-semibold">
                    Período
                  </Label>
                  <div className="flex gap-1">
                    {[1, 5, 10, 20, 30].map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setPeriodUnit("years");
                          setPeriodText(String(yr));
                        }}
                        className={`rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                          periodUnit === "years" && parsedPeriod === yr
                            ? "border-primary bg-primary/10 text-primary"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {yr}a
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="period"
                    type="text"
                    inputMode="numeric"
                    value={periodText}
                    onChange={(e) => setPeriodText(e.target.value)}
                    className="h-11 flex-1 font-mono text-base font-medium"
                    placeholder="10"
                    aria-label="Período da Simulação"
                  />
                  <Select
                    value={periodUnit}
                    onValueChange={(val) =>
                      setPeriodUnit(val as TimePeriodUnit)
                    }
                  >
                    <SelectTrigger
                      id="select-period"
                      className="h-11 w-[130px] shrink-0 font-medium"
                      aria-label="Unidade do Período"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Anos</SelectItem>
                      <SelectItem value="months">Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-xs text-muted-foreground">
                  Total simulado: <strong>{result.totalMonths} meses</strong> (
                  {(result.totalMonths / 12).toFixed(1).replace(".0", "")}{" "}
                  {result.totalMonths === 12 ? "ano" : "anos"}).
                </p>
              </div>
            </div>

            {/* Barra de Ações do Formulário */}
            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Button
                id="btn-clear"
                type="button"
                variant="outline"
                onClick={handleClear}
                className="w-full gap-2 sm:w-auto"
              >
                <RotateCcw className="size-4" />
                Limpar
              </Button>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="submit"
                  className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto px-8"
                >
                  <Calculator className="size-4" />
                  Calcular Juros Compostos
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Seção 1: Os 3 Cards de Destaque (#result) */}
      <div id="result" className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Card 1: Valor Total Final */}
        <Card className="relative overflow-hidden border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-background to-background shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                Valor Total Final
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Wallet className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div
              id="amount"
              className="font-mono text-2xl font-extrabold tracking-tight text-emerald-700 sm:text-3xl dark:text-emerald-300"
            >
              {formatCurrencyBRL(result.finalAmount)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 font-mono text-emerald-700 dark:text-emerald-300"
              >
                {multiplier.toFixed(2).replace(".", ",")}x o investido
              </Badge>
              <span>após {result.totalMonths} meses</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Valor Total Investido */}
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-background to-background shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                Valor Total Investido
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <PiggyBank className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div
              id="invested"
              className="font-mono text-2xl font-bold tracking-tight sm:text-3xl"
            >
              {formatCurrencyBRL(result.totalInvested)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge
                variant="secondary"
                className="bg-blue-500/15 font-mono text-blue-700 dark:text-blue-300"
              >
                {result.investedPercentage.toFixed(1).replace(".", ",")}% do
                total
              </Badge>
              <span>Desembolso próprio</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total em Juros */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background shadow-xs">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-400">
                Total em Juros
              </span>
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Coins className="size-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div
              id="interest"
              className="font-mono text-2xl font-bold tracking-tight text-amber-700 sm:text-3xl dark:text-amber-300"
            >
              {formatCurrencyBRL(result.totalInterest)}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge
                variant="secondary"
                className="bg-amber-500/15 font-mono text-amber-800 dark:text-amber-300"
              >
                {result.interestPercentage.toFixed(1).replace(".", ",")}% do
                total
              </Badge>
              <span>Rendimento composto</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção 2: Visualização Gráfica Dupla (#resultGraphic) */}
      <div
        id="resultGraphic"
        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
      >
        {/* Gráfico 1: Rosca (Donut) de Composição */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChartIcon className="size-4 text-primary" />
              Composição do Montante
            </CardTitle>
            <CardDescription>
              Proporção entre aportes próprios e juros compostos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-between gap-4 pt-2">
            <div className="relative flex size-44 items-center justify-center">
              <svg
                viewBox="0 0 160 160"
                className="size-full -rotate-90 transform"
                role="img"
                aria-label="Gráfico de rosca de proporção entre valor investido e total em juros"
              >
                {/* Círculo de Fundo / Total Investido (Azul) */}
                <circle
                  cx="80"
                  cy="80"
                  r={donutRadius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="20"
                  className="text-blue-500/85"
                />
                {/* Fatia de Juros (Esmeralda/Âmbar) */}
                {result.interestPercentage > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={donutRadius}
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="20"
                    strokeDasharray={`${interestArcLength} ${investedArcLength}`}
                    strokeLinecap="butt"
                    className="text-emerald-500 transition-all duration-500"
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[11px] font-medium text-muted-foreground">
                  Juros no Final
                </span>
                <span className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {result.interestPercentage.toFixed(1).replace(".", ",")}%
                </span>
              </div>
            </div>

            {/* Legenda Detalhada com Barras de Proporção */}
            <div className="w-full space-y-3 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="size-2.5 rounded-full bg-blue-500" />
                    Valor Investido
                  </span>
                  <span className="font-mono font-semibold">
                    {formatCurrencyBRL(result.totalInvested)} (
                    {result.investedPercentage.toFixed(1).replace(".", ",")}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, result.investedPercentage)}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    Total em Juros
                  </span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyBRL(result.totalInterest)} (
                    {result.interestPercentage.toFixed(1).replace(".", ",")}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, result.interestPercentage)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Evolução Patrimonial no Tempo (Barras Empilhadas Interativas) */}
        <Card className="lg:col-span-8">
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="size-4 text-primary" />
                  Evolução Patrimonial no Tempo
                </CardTitle>
                <CardDescription>
                  Passe o mouse ou toque nas colunas para inspecionar cada{" "}
                  {chartUsesYears ? "ano" : "mês"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-blue-500" />
                  Investido
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-emerald-500" />
                  Juros Acumulados
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Painel de Inspeção Interativo (Tooltip Fixo Responsivo) */}
            <div className="grid grid-cols-2 gap-2 rounded-xl border bg-muted/40 p-3 text-xs sm:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Período Selecionado</span>
                <p className="mt-0.5 font-semibold text-foreground">
                  {inspectedRow.month === 0
                    ? "Mês 0 (Início)"
                    : chartUsesYears
                      ? `Ano ${inspectedRow.year} (Mês ${inspectedRow.month})`
                      : `Mês ${inspectedRow.month}`}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Total Investido</span>
                <p className="mt-0.5 font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrencyBRL(inspectedRow.totalInvested)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Total em Juros</span>
                <p className="mt-0.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyBRL(inspectedRow.totalInterest)}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Patrimônio Acumulado</span>
                <p className="mt-0.5 font-mono font-bold text-foreground">
                  {formatCurrencyBRL(inspectedRow.totalAmount)}
                </p>
              </div>
            </div>

            {/* Área do Gráfico de Barras Empilhadas */}
            <div className="relative pt-2">
              <div className="flex h-56 items-end gap-1 sm:gap-1.5 border-b border-l border-border/70 px-2 pt-4 pb-1">
                {chartRows.map((row, idx) => {
                  const maxAmount = Math.max(result.finalAmount, 1);
                  const investedHeightPct = Math.max(
                    0,
                    (row.totalInvested / maxAmount) * 100
                  );
                  const interestHeightPct = Math.max(
                    0,
                    (row.totalInterest / maxAmount) * 100
                  );
                  const isActive =
                    activeChartIndex === idx ||
                    (activeChartIndex === null && idx === chartRows.length - 1);

                  return (
                    <button
                      key={row.month}
                      type="button"
                      onMouseEnter={() => setActiveChartIndex(idx)}
                      onFocus={() => setActiveChartIndex(idx)}
                      onClick={() => setActiveChartIndex(idx)}
                      className={`group relative flex h-full flex-1 flex-col justify-end rounded-t transition-all focus:outline-none cursor-pointer ${
                        isActive ? "bg-muted/60" : "hover:bg-muted/30"
                      }`}
                      aria-label={`Período ${row.month}: Acumulado ${formatCurrencyBRL(row.totalAmount)}`}
                    >
                      {/* Topo da Pilha: Juros */}
                      <div
                        className={`w-full rounded-t-xs bg-emerald-500 transition-all duration-300 ${
                          isActive ? "opacity-100 ring-1 ring-emerald-400" : "opacity-85 group-hover:opacity-100"
                        }`}
                        style={{
                          height: `${interestHeightPct}%`,
                          minHeight: row.totalInterest > 0 ? "2px" : "0px",
                        }}
                      />
                      {/* Base da Pilha: Total Investido */}
                      <div
                        className={`w-full bg-blue-500 transition-all duration-300 ${
                          row.totalInterest <= 0 ? "rounded-t-xs" : ""
                        } ${isActive ? "opacity-100" : "opacity-85 group-hover:opacity-100"}`}
                        style={{
                          height: `${investedHeightPct}%`,
                          minHeight: row.totalInvested > 0 ? "3px" : "0px",
                        }}
                      />
                    </button>
                  );
                })}
              </div>

              {/* Eixo X e Escala Resumida */}
              <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                <span>Início (Mês 0)</span>
                <span>
                  Meio ({formatCompactBRL(chartRows[Math.floor(chartRows.length / 2)]?.totalAmount ?? 0)})
                </span>
                <span>
                  Final ({formatCompactBRL(result.finalAmount)})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção 3: Tabela de Evolução Período a Período (#evolutionTable) */}
      <Card id="evolutionTable">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TableIcon className="size-5 text-primary" />
                Tabela de Evolução Detalhada
              </CardTitle>
              <CardDescription>
                Acompanhe o efeito bola de neve dos juros compostos período a
                período.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Tabs
                value={tableMode}
                onValueChange={(v) =>
                  setTableMode(v as "monthly" | "yearly")
                }
              >
                <TabsList className="h-9">
                  <TabsTrigger value="monthly" className="text-xs">
                    Visão Mensal ({result.monthlyEvolution.length})
                  </TabsTrigger>
                  <TabsTrigger value="yearly" className="text-xs">
                    Visão Anual ({result.yearlyEvolution.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadCsv}
                className="h-9 gap-1.5"
              >
                <Download className="size-4" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-[480px] overflow-auto rounded-lg border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-xs">
                <TableRow>
                  <TableHead className="w-[100px] font-semibold">
                    {tableMode === "monthly" ? "Meses" : "Anos"}
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Juros
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Total Investido
                  </TableHead>
                  <TableHead className="text-right font-semibold">
                    Total Juros
                  </TableHead>
                  <TableHead className="text-right font-bold text-emerald-700 dark:text-emerald-400">
                    Acumulado
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTableRows.map((row) => (
                  <TableRow key={`${tableMode}-${row.month}`}>
                    <TableCell className="font-mono font-medium">
                      {tableMode === "monthly" ? (
                        row.month === 0 ? (
                          <Badge variant="outline" className="font-mono">
                            Mês 0
                          </Badge>
                        ) : (
                          `Mês ${row.month}`
                        )
                      ) : row.month === 0 ? (
                        <Badge variant="outline" className="font-mono">
                          Início
                        </Badge>
                      ) : (
                        `Ano ${row.year} (${row.month}m)`
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {formatCurrencyBRL(row.periodInterest)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-blue-600 dark:text-blue-400">
                      {formatCurrencyBRL(row.totalInvested)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-amber-600 dark:text-amber-400">
                      {formatCurrencyBRL(row.totalInterest)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatCurrencyBRL(row.totalAmount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {tableMode === "monthly" && activeTableRows.length > 25 && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMonths((prev) => !prev)}
                className="gap-1.5 text-xs"
              >
                {showAllMonths ? (
                  <>
                    <ChevronUp className="size-4" />
                    Recolher tabela (mostrar primeiros 24 meses)
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-4" />
                    Mostrar todos os {activeTableRows.length - 1} meses
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 4: Guia Educativo e Fórmula Passo a Passo (Estilo Investidor10) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="size-5 text-primary" />
            Como Funciona o Cálculo de Juros Compostos?
          </CardTitle>
          <CardDescription>
            Entenda a matemática exata utilizada pelo Investidor10 e veja a
            aplicação passo a passo nos seus números.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-sm leading-relaxed">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Info className="size-4 text-emerald-500" />
                1. Fórmulas Matemáticas Exatas
              </h3>
              <p className="text-muted-foreground">
                Quando há um aporte inicial (<code className="font-mono">P₀</code>)
                combinado com aportes mensais constantes (
                <code className="font-mono">PMT</code>), o Valor Futuro (
                <code className="font-mono">FV</code>) após{" "}
                <code className="font-mono">N</code> meses é dado por:
              </p>
              <div className="overflow-x-auto rounded-lg border bg-background p-3 font-mono text-xs">
                FV = P₀ · (1 + iₘ)ᴺ + PMT · [((1 + iₘ)ᴺ - 1) / iₘ]
              </div>
              <p className="text-xs text-muted-foreground">
                Onde <code className="font-mono">iₘ</code> é a taxa efetiva
                mensal. Quando você informa uma taxa anual (
                <code className="font-mono">iₐ</code>), usamos a equivalência
                exponencial composta exata:
              </p>
              <div className="rounded-lg border bg-background p-2.5 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                iₘ = (1 + iₐ)^(1/12) - 1
              </div>
            </div>

            <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
              <h3 className="font-semibold text-foreground">
                2. Passo a Passo da Sua Simulação Atual
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex justify-between border-b pb-1.5">
                  <span>Capital Inicial (P₀):</span>
                  <strong className="font-mono text-foreground">
                    {formatCurrencyBRL(initialValue)}
                  </strong>
                </li>
                <li className="flex justify-between border-b pb-1.5">
                  <span>Aporte Mensal (PMT):</span>
                  <strong className="font-mono text-foreground">
                    {formatCurrencyBRL(monthlyContribution)}
                  </strong>
                </li>
                <li className="flex justify-between border-b pb-1.5">
                  <span>Taxa Efetiva Mensal (iₘ):</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    {(result.effectiveMonthlyRate * 100)
                      .toFixed(6)
                      .replace(".", ",")}
                    % a.m.
                  </strong>
                </li>
                <li className="flex justify-between border-b pb-1.5">
                  <span>Taxa Efetiva Anual Equivalente (iₐ):</span>
                  <strong className="font-mono text-foreground">
                    {(result.effectiveAnnualRate * 100)
                      .toFixed(2)
                      .replace(".", ",")}
                    % a.a.
                  </strong>
                </li>
                <li className="flex justify-between border-b pb-1.5">
                  <span>Prazo Total (N):</span>
                  <strong className="font-mono text-foreground">
                    {result.totalMonths} meses
                  </strong>
                </li>
                <li className="flex justify-between pt-1">
                  <span>Rendimento do 1º Mês:</span>
                  <strong className="font-mono text-foreground">
                    {formatCurrencyBRL(
                      result.monthlyEvolution[1]?.periodInterest ?? 0
                    )}
                  </strong>
                </li>
                <li className="flex justify-between">
                  <span>Rendimento do Último Mês:</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyBRL(
                      result.monthlyEvolution[
                        result.monthlyEvolution.length - 1
                      ]?.periodInterest ?? 0
                    )}
                  </strong>
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4 text-xs text-muted-foreground sm:grid-cols-3">
            <div>
              <h4 className="mb-1 font-semibold text-foreground">
                Juros Simples vs. Compostos
              </h4>
              <p>
                Nos juros simples, a taxa incide apenas sobre o valor principal.
                Nos juros compostos (&ldquo;juros sobre juros&rdquo;), o rendimento de cada
                mês passa a render também nos meses seguintes.
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-foreground">
                Por que não dividir a taxa anual por 12?
              </h4>
              <p>
                Dividir 12% ao ano por 12 geraria 1% ao mês, que capitalizado
                resulta em 12,68% ao ano. A equivalência composta{" "}
                <code className="font-mono">(1+i)^(1/12)-1</code> garante
                precisão financeira real.
              </p>
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-foreground">
                O Poder da Constância
              </h4>
              <p>
                Aportes mensais regulares aceleram a curva exponencial. No longo
                prazo, a fatia de juros supera o total desembolsado do próprio
                bolso.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CompoundInterestFeature;

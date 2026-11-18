"use client";

import * as React from "react";
import {
  TrendingUp,
  Calculator,
  RotateCcw,
  RefreshCw,
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
  Receipt,
  ShieldCheck,
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
import { ToolPageHeader } from "@/components/layout/tool-page-header";

import type { MarketIndicators } from "@/services/bcb/bcb-client";
import { BcbPresetsSkeleton } from "./compound-interest-skeleton";
import {
  DEFAULT_COMPOUND_INTEREST_INPUT,
  INCOME_TAX_BRACKETS,
  buildPresetsFromIndicators,
  calculateCompoundInterest,
  formatCompactBRL,
  formatCurrencyBRL,
  formatDecimalBR,
  formatPresetChipLabel,
  formatRatePtBr,
  generateEvolutionCsv,
  getIncomeTaxBracket,
  isMarketIndicators,
  parseCurrencyInputBR,
  type CompoundInterestPreset,
  type EvolutionRow,
  type RatePeriodUnit,
  type ResultViewMode,
  type TaxRegime,
  type TimePeriodUnit,
} from "./compound-interest-utils";

export interface CompoundInterestFeatureProps {
  initialIndicators?: MarketIndicators;
}

async function fetchIndicatorsFromApi(
  signal: AbortSignal
): Promise<MarketIndicators | null> {
  try {
    const response = await fetch("/api/indicators", {
      cache: "no-store",
      signal,
    });
    if (!response.ok) {
      return null;
    }
    const data: unknown = await response.json();
    return isMarketIndicators(data) ? data : null;
  } catch {
    return null;
  }
}

export function CompoundInterestFeature({
  initialIndicators,
}: CompoundInterestFeatureProps = {}) {
  // Indicadores econômicos dinâmicos do Banco Central (BCB SGS)
  const [indicators, setIndicators] = React.useState<MarketIndicators | null>(
    initialIndicators ?? null
  );
  const [isLoadingIndicators, setIsLoadingIndicators] = React.useState<boolean>(
    initialIndicators === undefined
  );
  const activeControllerRef = React.useRef<AbortController | null>(null);
  const isMountedRef = React.useRef<boolean>(true);
  const hasUserEditedRateRef = React.useRef<boolean>(false);

  // Estados dos inputs financeiros
  const [initialValue, setInitialValue] = React.useState<number>(
    DEFAULT_COMPOUND_INTEREST_INPUT.initialValue
  );
  const [monthlyContribution, setMonthlyContribution] = React.useState<number>(
    DEFAULT_COMPOUND_INTEREST_INPUT.monthlyContribution
  );
  const [rateText, setRateText] = React.useState<string>(() =>
    formatRatePtBr(
      initialIndicators?.taxaDi.value ??
        DEFAULT_COMPOUND_INTEREST_INPUT.interestRate
    )
  );
  const [rateUnit, setRateUnit] = React.useState<RatePeriodUnit>(
    DEFAULT_COMPOUND_INTEREST_INPUT.rateUnit
  );
  const [periodText, setPeriodText] = React.useState<string>("10");
  const [periodUnit, setPeriodUnit] = React.useState<TimePeriodUnit>(
    DEFAULT_COMPOUND_INTEREST_INPUT.periodUnit
  );

  const handleRefreshIndicators = React.useCallback(async () => {
    activeControllerRef.current?.abort();
    const controller = new AbortController();
    activeControllerRef.current = controller;
    setIsLoadingIndicators(true);

    const nextIndicators = await fetchIndicatorsFromApi(controller.signal);
    if (!controller.signal.aborted && isMountedRef.current) {
      setIndicators(nextIndicators);
      setIsLoadingIndicators(false);
    }
  }, []);

  React.useEffect(() => {
    isMountedRef.current = true;
    const controller = new AbortController();
    activeControllerRef.current = controller;

    // Só busca no cliente quando o componente é montado sem dados SSR iniciais
    if (initialIndicators === undefined) {
      void (async () => {
        const nextIndicators = await fetchIndicatorsFromApi(controller.signal);
        if (!controller.signal.aborted && isMountedRef.current) {
          setIndicators(nextIndicators);
          if (nextIndicators && !hasUserEditedRateRef.current) {
            setRateText(formatRatePtBr(nextIndicators.taxaDi.value));
            setRateUnit(DEFAULT_COMPOUND_INTEREST_INPUT.rateUnit);
          }
          setIsLoadingIndicators(false);
        }
      })();
    }

    return () => {
      isMountedRef.current = false;
      activeControllerRef.current?.abort();
    };
  }, [initialIndicators]);

  const presets = React.useMemo(
    () => buildPresetsFromIndicators(indicators),
    [indicators]
  );

  // Estado de visualização de gráfico, tabela e tributação (IR)
  const [viewMode, setViewMode] = React.useState<ResultViewMode>("gross");
  const [taxRegime, setTaxRegime] = React.useState<TaxRegime>("regressive");
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
    return calculateCompoundInterest(
      {
        initialValue,
        monthlyContribution,
        interestRate: parsedRate,
        rateUnit,
        period: parsedPeriod,
        periodUnit,
      },
      taxRegime
    );
  }, [
    initialValue,
    monthlyContribution,
    parsedRate,
    rateUnit,
    parsedPeriod,
    periodUnit,
    taxRegime,
  ]);

  const regressiveBracket = React.useMemo(
    () => getIncomeTaxBracket(result.totalMonths, "regressive"),
    [result.totalMonths]
  );

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
    hasUserEditedRateRef.current = true;
    setRateText(formatRatePtBr(preset.rate));
    setRateUnit(preset.rateUnit);
    toast.success(`Taxa ajustada para ${preset.label} (${preset.badge})`);
  };

  const handleClear = () => {
    hasUserEditedRateRef.current = true;
    setInitialValue(0);
    setMonthlyContribution(0);
    setRateText("0,00");
    setPeriodText("1");
    setActiveChartIndex(null);
    toast.info("Campos limpos. Insira novos valores para simular.");
  };

  const handleResetDefaults = () => {
    hasUserEditedRateRef.current = false;
    setInitialValue(DEFAULT_COMPOUND_INTEREST_INPUT.initialValue);
    setMonthlyContribution(DEFAULT_COMPOUND_INTEREST_INPUT.monthlyContribution);
    setRateText(
      formatRatePtBr(
        indicators?.taxaDi.value ?? DEFAULT_COMPOUND_INTEREST_INPUT.interestRate
      )
    );
    setRateUnit(DEFAULT_COMPOUND_INTEREST_INPUT.rateUnit);
    setPeriodText("10");
    setPeriodUnit(DEFAULT_COMPOUND_INTEREST_INPUT.periodUnit);
    setViewMode("gross");
    setTaxRegime("regressive");
    setActiveChartIndex(null);
    toast.success("Valores padrão restaurados.");
  };

  const handleCopySummary = async () => {
    const regimeDescription =
      taxRegime === "exempt"
        ? "Isento de IR (LCI, LCA, Poupança)"
        : "Tabela Regressiva de IR (Renda Fixa)";
    const formattedIrRate = result.irRatePercent.toFixed(1).replace(".", ",");
    const text = [
      "📊 Simulação de Juros Compostos — DevToolsBR",
      `• Valor Inicial: ${formatCurrencyBRL(initialValue)}`,
      `• Aporte Mensal: ${formatCurrencyBRL(monthlyContribution)}`,
      `• Taxa de Juros: ${rateText}% (${rateUnit === "year" ? "ao ano" : "ao mês"})`,
      `• Período: ${result.totalMonths} meses (${(result.totalMonths / 12).toFixed(1).replace(".0", "")} anos)`,
      `• Regime Tributário: ${regimeDescription}`,
      `• Alíquota IR: ${formattedIrRate}% (${result.irBracketLabel})`,
      "────────────────────────────",
      `💰 Valor Total Final (Bruto): ${formatCurrencyBRL(result.finalAmount)}`,
      `🧾 IR Estimado: -${formatCurrencyBRL(result.irAmount)} (${formattedIrRate}%)`,
      `💵 Valor Líquido Final: ${formatCurrencyBRL(result.netFinalAmount)}`,
      `📥 Total Investido: ${formatCurrencyBRL(result.totalInvested)} (${(viewMode === "net" ? result.netInvestedPercentage : result.investedPercentage).toFixed(1)}%)`,
      `📈 Total em Juros (Bruto / Líquido): ${formatCurrencyBRL(result.totalInterest)} / ${formatCurrencyBRL(result.netTotalInterest)}`,
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
    const csv = generateEvolutionCsv(rows, tableMode, viewMode);
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `juros-compostos-${tableMode}-${viewMode}-${result.totalMonths}m.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Planilha CSV exportada com sucesso!");
  };

  const isNetView = viewMode === "net";
  const displayedFinalAmount = isNetView
    ? result.netFinalAmount
    : result.finalAmount;
  const displayedTotalInterest = isNetView
    ? result.netTotalInterest
    : result.totalInterest;
  const displayedInvestedPct = isNetView
    ? result.netInvestedPercentage
    : result.investedPercentage;
  const displayedInterestPct = isNetView
    ? result.netInterestPercentage
    : result.interestPercentage;

  // Cálculo do gráfico de rosca (Donut SVG)
  const donutRadius = 62;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const interestArcLength =
    (displayedInterestPct / 100) * donutCircumference;
  const investedArcLength = donutCircumference - interestArcLength;

  // Linhas da tabela ativa
  const activeTableRows =
    tableMode === "monthly" ? result.monthlyEvolution : result.yearlyEvolution;
  const visibleTableRows =
    tableMode === "monthly" && !showAllMonths && activeTableRows.length > 25
      ? activeTableRows.slice(0, 25)
      : activeTableRows;

  const multiplier =
    result.totalInvested > 0 ? displayedFinalAmount / result.totalInvested : 1;

  const formattedRegressiveRate = regressiveBracket.ratePercent
    .toFixed(1)
    .replace(".", ",");
  const formattedActiveIrRate = result.irRatePercent
    .toFixed(1)
    .replace(".", ",");

  return (
    <div className="w-full space-y-4 sm:space-y-5 pb-8">
      <ToolPageHeader
        icon={<TrendingUp className="size-4 sm:size-5" />}
        iconClassName="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        title="Calculadora de Juros Compostos"
        mobileTitle="Juros Compostos"
        description="Simule aportes mensais, equivalência de taxas, valor líquido após IR e tabela mês a mês."
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResetDefaults}
              className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Restaurar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopySummary}
              className="h-8 sm:h-9 gap-1.5 px-2.5 sm:px-3 text-xs font-medium"
            >
              {copiedSummary ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
              {copiedSummary ? (
                <span>Copiado</span>
              ) : (
                <>
                  <span className="sm:hidden">Copiar</span>
                  <span className="hidden sm:inline">Copiar Resumo</span>
                </>
              )}
            </Button>
          </>
        }
      />

      {/* Card Principal de Simulação com Presets Integrados (#feesCompostosForm) */}
      <Card className="border-border/80 gap-0 p-4 sm:p-5 shadow-xs">
        <CardContent className="p-0 space-y-4">
          {/* Barra Horizontal de Presets ou Skeleton Loader */}
          {isLoadingIndicators ? (
            <BcbPresetsSkeleton />
          ) : (
            <div className="space-y-2.5">
              <div
                id="presets-bar"
                data-testid="bcb-presets-bar"
                className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
              >
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0 pr-1">
                  <Sparkles className="size-3.5 text-amber-500" />
                  Taxas:
                </span>
                {presets.map((preset) => {
                  const isSelected =
                    Math.abs(parsedRate - preset.rate) < 0.005 &&
                    rateUnit === preset.rateUnit;
                  const chipLabel = formatPresetChipLabel(preset);
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      data-testid={`preset-${preset.id}`}
                      onClick={() => handleApplyPreset(preset)}
                      title={preset.description}
                      className={`inline-flex h-8 items-center px-3 text-xs font-medium rounded-lg border shrink-0 transition-colors cursor-pointer ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                          : "border-border bg-background hover:bg-muted/80 text-foreground"
                      }`}
                    >
                      {chipLabel}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg bg-muted/40 px-3 py-2">
                <div
                  data-testid="bcb-indicators-status"
                  className="min-w-0 flex-1 text-xs leading-relaxed text-muted-foreground"
                >
                  {indicators ? (
                    <span>
                      {indicators.usedFallback
                        ? "Taxas BCB (ref. reserva)"
                        : "Taxas BCB"}{" "}
                      • Ref. {indicators.taxaDi.date} • IPCA 12m:{" "}
                      {formatRatePtBr(indicators.ipca12Meses.value)}% • Dólar PTAX:
                      R$ {formatRatePtBr(indicators.dolarPtaxVenda.value)}
                    </span>
                  ) : (
                    <span>
                      Taxas de referência padrão • Selic 14,25% • CDI 14,15% •
                      IPCA 4,50%
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  data-testid="refresh-bcb-indicators"
                  aria-label="Atualizar taxas BCB"
                  title="Atualizar taxas BCB"
                  onClick={handleRefreshIndicators}
                  className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border bg-background px-3 text-xs font-medium text-foreground shadow-2xs transition-colors hover:bg-muted cursor-pointer"
                >
                  <RefreshCw className="size-3.5" />
                  <span>Sincronizar</span>
                </button>
              </div>
            </div>
          )}

          <form
            id="feesCompostosForm"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Simulação de juros compostos atualizada!");
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Campo 1: Valor Inicial */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label
                    htmlFor="mainValue"
                    className="text-xs sm:text-sm font-medium"
                  >
                    Valor Inicial
                  </Label>
                  <div className="flex items-center gap-2">
                    {[1000, 5000, 10000].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setInitialValue((prev) => prev + inc)}
                        className="inline-flex h-7 items-center rounded-md border bg-muted/50 px-2.5 text-xs font-medium leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                      >
                        +{inc >= 1000 ? `${inc / 1000}k` : inc}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-muted-foreground">
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
                    className="h-10 pl-9 text-sm font-mono font-medium"
                    placeholder="0,00"
                    aria-label="Valor Inicial em Reais"
                  />
                </div>
              </div>

              {/* Campo 2: Aporte Mensal */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label
                    htmlFor="investment"
                    className="text-xs sm:text-sm font-medium"
                  >
                    Aporte Mensal
                  </Label>
                  <div className="flex items-center gap-2">
                    {[200, 500, 1000].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() =>
                          setMonthlyContribution((prev) => prev + inc)
                        }
                        className="inline-flex h-7 items-center rounded-md border bg-muted/50 px-2.5 text-xs font-medium leading-none text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                      >
                        +{inc >= 1000 ? `${inc / 1000}k` : inc}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-muted-foreground">
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
                    className="h-10 pl-9 text-sm font-mono font-medium"
                    placeholder="0,00"
                    aria-label="Aporte Mensal em Reais"
                  />
                </div>
              </div>

              {/* Campo 3: Taxa de Juros */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="rate"
                    className="text-xs sm:text-sm font-medium"
                  >
                    Taxa de Juros
                  </Label>
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-mono text-xs font-medium leading-none text-emerald-700 dark:text-emerald-300">
                    {rateUnit === "year"
                      ? `≈ ${(result.effectiveMonthlyRate * 100).toFixed(2).replace(".", ",")}% a.m.`
                      : `≈ ${(result.effectiveAnnualRate * 100).toFixed(2).replace(".", ",")}% a.a.`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-semibold text-muted-foreground">
                      %
                    </span>
                    <Input
                      id="rate"
                      type="text"
                      inputMode="decimal"
                      value={rateText}
                      onChange={(e) => {
                        hasUserEditedRateRef.current = true;
                        setRateText(e.target.value);
                      }}
                      className="h-10 pl-8 text-sm font-mono font-medium"
                      placeholder={formatRatePtBr(
                        DEFAULT_COMPOUND_INTEREST_INPUT.interestRate
                      )}
                      aria-label="Taxa de Juros"
                    />
                  </div>
                  <Select
                    value={rateUnit}
                    onValueChange={(val) => {
                      hasUserEditedRateRef.current = true;
                      setRateUnit(val as RatePeriodUnit);
                    }}
                  >
                    <SelectTrigger
                      id="select-rate"
                      className="h-10 w-[105px] sm:w-[120px] shrink-0 px-3 text-xs font-medium"
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
              </div>

              {/* Campo 4: Período */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="period"
                    className="text-xs sm:text-sm font-medium"
                  >
                    Período ({result.totalMonths}m)
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="period"
                    type="text"
                    inputMode="numeric"
                    value={periodText}
                    onChange={(e) => setPeriodText(e.target.value)}
                    className="h-10 flex-1 text-sm font-mono font-medium"
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
                      className="h-10 w-[105px] sm:w-[120px] shrink-0 px-3 text-xs font-medium"
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
                <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                  {[1, 5, 10, 20, 30].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setPeriodUnit("years");
                        setPeriodText(String(yr));
                      }}
                      className={`inline-flex h-8 items-center justify-center rounded-lg border px-2.5 text-xs font-medium leading-none transition-colors cursor-pointer ${
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
            </div>

            {/* Barra de Ações */}
            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <Button
                id="btn-clear"
                type="button"
                variant="outline"
                onClick={handleClear}
                className="h-10 gap-1.5 px-4 text-xs sm:text-sm font-medium"
              >
                <RotateCcw className="size-3.5" />
                Limpar
              </Button>

              <Button
                type="submit"
                className="h-10 gap-1.5 bg-emerald-600 px-4 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700"
              >
                <Calculator className="size-3.5" />
                Calcular Juros Compostos
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Controles de Visão (Bruto vs Líquido) e Regime de IR */}
      <div
        data-testid="tax-controls-bar"
        className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-muted/40 p-2 sm:p-2.5"
      >
        <div
          role="group"
          aria-label="Modo de visualização do resultado"
          className="inline-flex items-center gap-1 rounded-lg bg-background p-1 border border-border/60"
        >
          <button
            type="button"
            data-testid="view-mode-gross"
            aria-pressed={viewMode === "gross"}
            onClick={() => setViewMode("gross")}
            className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors cursor-pointer ${
              viewMode === "gross"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Bruto</span>
            <span className="hidden sm:inline">Valor Bruto</span>
          </button>
          <button
            type="button"
            data-testid="view-mode-net"
            aria-pressed={viewMode === "net"}
            onClick={() => setViewMode("net")}
            className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors cursor-pointer ${
              viewMode === "net"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Líquido</span>
            <span className="hidden sm:inline">Valor Líquido (IR)</span>
          </button>
        </div>

        <div
          role="group"
          aria-label="Regime tributário"
          className="inline-flex items-center gap-1 rounded-lg bg-background p-1 border border-border/60"
        >
          <button
            type="button"
            data-testid="tax-regime-regressive"
            aria-pressed={taxRegime === "regressive"}
            onClick={() => setTaxRegime("regressive")}
            className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors cursor-pointer ${
              taxRegime === "regressive"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">IR {formattedRegressiveRate}%</span>
            <span className="hidden sm:inline">
              Tabela IR ({formattedRegressiveRate}%)
            </span>
          </button>
          <button
            type="button"
            data-testid="tax-regime-exempt"
            aria-pressed={taxRegime === "exempt"}
            onClick={() => setTaxRegime("exempt")}
            className={`h-8 rounded-lg px-3 text-xs font-medium transition-colors cursor-pointer ${
              taxRegime === "exempt"
                ? "bg-sky-600 text-white shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="sm:hidden">Isento</span>
            <span className="hidden sm:inline">Isento (LCI/LCA)</span>
          </button>
        </div>
      </div>

      {/* Seção 1: Os 3 Cards de Resumo Imediatamente Abaixo dos Inputs (#result) */}
      <div
        id="result"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {/* Card 1: Valor Total Final */}
        <Card className="relative overflow-hidden border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-background to-background gap-2 p-4 sm:p-5 shadow-sm">
          <CardHeader className="p-0 pb-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                {isNetView ? "Valor Líquido Final" : "Valor Total Final"}
              </span>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Wallet className="size-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 p-0">
            <div
              id="amount"
              className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-emerald-700 dark:text-emerald-300"
            >
              {formatCurrencyBRL(displayedFinalAmount)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge
                variant="secondary"
                className="bg-emerald-500/15 px-1.5 py-0 font-mono text-xs text-emerald-700 dark:text-emerald-300"
              >
                {multiplier.toFixed(2).replace(".", ",")}x o investido
              </Badge>
              {isNetView ? (
                <Badge
                  variant="secondary"
                  data-testid="ir-deduction-badge"
                  className={
                    taxRegime === "exempt"
                      ? "bg-sky-500/15 px-1.5 py-0 font-mono text-xs text-sky-700 dark:text-sky-300"
                      : "bg-rose-500/10 px-1.5 py-0 font-mono text-xs text-rose-700 dark:text-rose-300"
                  }
                >
                  {taxRegime === "exempt"
                    ? "Isento de IR (0,0%)"
                    : `IR ${formattedActiveIrRate}%: -${formatCurrencyBRL(result.irAmount)}`}
                </Badge>
              ) : (
                <>
                  <span>após {result.totalMonths} meses</span>
                  <span
                    data-testid="net-preview-hint"
                    className="hidden sm:inline font-mono text-emerald-700/80 dark:text-emerald-300/80"
                  >
                    • Líquido: {formatCurrencyBRL(result.netFinalAmount)}
                  </span>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Investido */}
        <Card className="border-blue-500/30 bg-gradient-to-br from-blue-500/5 via-background to-background gap-2 p-4 sm:p-5 shadow-xs">
          <CardHeader className="p-0 pb-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-blue-700 uppercase dark:text-blue-400">
                Total Investido
              </span>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400">
                <PiggyBank className="size-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 p-0">
            <div
              id="invested"
              className="text-xl sm:text-2xl font-bold font-mono tracking-tight"
            >
              {formatCurrencyBRL(result.totalInvested)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge
                variant="secondary"
                className="bg-blue-500/15 px-1.5 py-0 font-mono text-xs text-blue-700 dark:text-blue-300"
              >
                {displayedInvestedPct.toFixed(1).replace(".", ",")}% do total
              </Badge>
              <span>Desembolso próprio</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Total em Juros */}
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-background to-background gap-2 p-4 sm:p-5 shadow-xs">
          <CardHeader className="p-0 pb-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase dark:text-amber-400">
                {isNetView ? "Juros Líquidos" : "Total em Juros"}
              </span>
              <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <Coins className="size-3.5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1.5 p-0">
            <div
              id="interest"
              className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-amber-700 dark:text-amber-300"
            >
              {formatCurrencyBRL(displayedTotalInterest)}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <Badge
                variant="secondary"
                className="bg-amber-500/15 px-1.5 py-0 font-mono text-xs text-amber-800 dark:text-amber-300"
              >
                {displayedInterestPct.toFixed(1).replace(".", ",")}% do total
              </Badge>
              <span>
                {isNetView
                  ? taxRegime === "exempt"
                    ? "Rendimento isento de IR"
                    : `Após IR (${formattedActiveIrRate}%)`
                  : "Rendimento composto"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção 2: Visualização Gráfica Dupla (#resultGraphic) */}
      <div
        id="resultGraphic"
        className="grid grid-cols-1 gap-4 lg:grid-cols-12"
      >
        {/* Gráfico 1: Rosca (Donut) de Composição */}
        <Card className="gap-4 p-4 sm:p-5 lg:col-span-5">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight">
              <PieChartIcon className="size-4 text-primary sm:size-5" />
              Composição do Montante
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Proporção entre aportes próprios e juros compostos
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-between gap-4 p-0">
            <div className="relative flex size-40 sm:size-44 items-center justify-center">
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
                {/* Fatia de Juros (Esmeralda) */}
                {displayedInterestPct > 0 && (
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
                <span className="text-xs font-medium text-muted-foreground">
                  {isNetView ? "Juros Líquidos" : "Juros no Final"}
                </span>
                <span className="mt-0.5 font-mono text-lg sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {displayedInterestPct.toFixed(1).replace(".", ",")}%
                </span>
              </div>
            </div>

            {/* Legenda Detalhada com Barras de Proporção */}
            <div className="w-full space-y-2.5 pt-1">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="size-2.5 rounded-full bg-blue-500" />
                    Valor Investido
                  </span>
                  <span className="font-mono font-semibold">
                    {formatCurrencyBRL(result.totalInvested)} (
                    {displayedInvestedPct.toFixed(1).replace(".", ",")}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, displayedInvestedPct)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="size-2.5 rounded-full bg-emerald-500" />
                    {isNetView ? "Juros Líquidos" : "Total em Juros"}
                  </span>
                  <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrencyBRL(displayedTotalInterest)} (
                    {displayedInterestPct.toFixed(1).replace(".", ",")}%)
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${Math.min(100, displayedInterestPct)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Evolução Patrimonial no Tempo (Barras Empilhadas Interativas) */}
        <Card className="gap-4 p-4 sm:p-5 lg:col-span-7">
          <CardHeader className="p-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-0.5">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight">
                  <BarChart3 className="size-4 text-primary sm:size-5" />
                  Evolução Patrimonial no Tempo
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  Toque ou passe o mouse nas colunas para inspecionar cada{" "}
                  {chartUsesYears ? "ano" : "mês"}
                  {isNetView ? " (valores líquidos após IR)" : ""}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3 text-xs font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-blue-500" />
                  Investido
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-xs bg-emerald-500" />
                  {isNetView ? "Juros Líquidos" : "Juros Acumulados"}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            {/* Painel de Inspeção Interativo (Tooltip Fixo Responsivo) */}
            <div className="grid grid-cols-2 gap-4 rounded-xl border bg-muted/40 p-3.5 sm:p-4 text-xs sm:grid-cols-4">
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Período
                </span>
                <p className="font-semibold text-foreground">
                  {inspectedRow.month === 0
                    ? "Mês 0 (Início)"
                    : chartUsesYears
                      ? `Ano ${inspectedRow.year} (${inspectedRow.month}m)`
                      : `Mês ${inspectedRow.month}`}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  Total Investido
                </span>
                <p className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrencyBRL(inspectedRow.totalInvested)}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {isNetView ? "Juros Líquidos" : "Total em Juros"}
                </span>
                <p className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrencyBRL(
                    isNetView
                      ? inspectedRow.netInterest
                      : inspectedRow.totalInterest
                  )}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {isNetView ? "Líquido Acumulado" : "Acumulado"}
                </span>
                <p className="font-mono font-bold text-foreground">
                  {formatCurrencyBRL(
                    isNetView
                      ? inspectedRow.netAmount
                      : inspectedRow.totalAmount
                  )}
                </p>
              </div>
            </div>

            {/* Área do Gráfico de Barras Empilhadas */}
            <div className="relative pt-1">
              <div className="flex h-48 sm:h-56 items-end gap-1 sm:gap-1.5 border-b border-l border-border/70 px-2 pt-3 pb-1">
                {chartRows.map((row, idx) => {
                  const maxAmount = Math.max(displayedFinalAmount, 1);
                  const rowInterest = isNetView
                    ? row.netInterest
                    : row.totalInterest;
                  const rowAmount = isNetView ? row.netAmount : row.totalAmount;
                  const investedHeightPct = Math.max(
                    0,
                    (row.totalInvested / maxAmount) * 100
                  );
                  const interestHeightPct = Math.max(
                    0,
                    (rowInterest / maxAmount) * 100
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
                      aria-label={`Período ${row.month}: Acumulado ${formatCurrencyBRL(rowAmount)}`}
                    >
                      {/* Topo da Pilha: Juros */}
                      <div
                        className={`w-full rounded-t-xs bg-emerald-500 transition-all duration-300 ${
                          isActive
                            ? "opacity-100 ring-1 ring-emerald-400"
                            : "opacity-85 group-hover:opacity-100"
                        }`}
                        style={{
                          height: `${interestHeightPct}%`,
                          minHeight: rowInterest > 0 ? "2px" : "0px",
                        }}
                      />
                      {/* Base da Pilha: Total Investido */}
                      <div
                        className={`w-full bg-blue-500 transition-all duration-300 ${
                          rowInterest <= 0 ? "rounded-t-xs" : ""
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
              <div className="mt-2 flex items-center justify-between font-mono text-xs text-muted-foreground">
                <span>Início (Mês 0)</span>
                <span>
                  Meio (
                  {formatCompactBRL(
                    (() => {
                      const midRow = chartRows[Math.floor(chartRows.length / 2)];
                      if (!midRow) return 0;
                      return isNetView ? midRow.netAmount : midRow.totalAmount;
                    })()
                  )}
                  )
                </span>
                <span>Final ({formatCompactBRL(displayedFinalAmount)})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção 3: Tabela de Evolução Período a Período (#evolutionTable) */}
      <Card id="evolutionTable" className="gap-4 p-4 sm:p-5">
        <CardHeader className="p-0">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight">
                <TableIcon className="size-4 text-primary sm:size-5" />
                Tabela de Evolução Detalhada
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {isNetView
                  ? "Acompanhe juros, alíquota de IR por prazo e valor líquido período a período."
                  : "Acompanhe o efeito dos juros compostos período a período."}
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Tabs
                value={tableMode}
                onValueChange={(v) => setTableMode(v as "monthly" | "yearly")}
              >
                <TabsList className="h-8 sm:h-9 p-1">
                  <TabsTrigger value="monthly" className="px-2.5 text-xs">
                    Mensal ({result.monthlyEvolution.length})
                  </TabsTrigger>
                  <TabsTrigger value="yearly" className="px-2.5 text-xs">
                    Anual ({result.yearlyEvolution.length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <Button
                type="button"
                variant="outline"
                onClick={handleDownloadCsv}
                className="h-8 sm:h-9 gap-1.5 px-3 text-xs font-medium"
              >
                <Download className="size-3.5" />
                Exportar CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="max-h-[440px] overflow-auto rounded-xl border">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-xs">
                <TableRow>
                  <TableHead className="w-[110px] px-3 py-2 text-xs font-semibold uppercase tracking-wider">
                    {tableMode === "monthly" ? "Meses" : "Anos"}
                  </TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">
                    Juros
                  </TableHead>
                  <TableHead className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">
                    Total Investido
                  </TableHead>
                  {isNetView ? (
                    <>
                      <TableHead className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">
                        IR (%)
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                        IR (R$)
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">
                        Juros Líquidos
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Total Líquido
                      </TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider">
                        Total Juros
                      </TableHead>
                      <TableHead className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Acumulado
                      </TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleTableRows.map((row) => (
                  <TableRow key={`${tableMode}-${row.month}`}>
                    <TableCell className="px-3 py-2 text-xs font-mono font-medium">
                      {tableMode === "monthly" ? (
                        row.month === 0 ? (
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0 font-mono text-xs"
                          >
                            Mês 0
                          </Badge>
                        ) : (
                          `Mês ${row.month}`
                        )
                      ) : row.month === 0 ? (
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 font-mono text-xs"
                        >
                          Início
                        </Badge>
                      ) : (
                        `Ano ${row.year} (${row.month}m)`
                      )}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right text-xs font-mono text-muted-foreground">
                      {formatCurrencyBRL(row.periodInterest)}
                    </TableCell>
                    <TableCell className="px-3 py-2 text-right text-xs font-mono text-blue-600 dark:text-blue-400">
                      {formatCurrencyBRL(row.totalInvested)}
                    </TableCell>
                    {isNetView ? (
                      <>
                        <TableCell className="px-3 py-2 text-right text-xs font-mono text-muted-foreground">
                          {row.month === 0
                            ? "—"
                            : `${row.irRatePercent.toFixed(1).replace(".", ",")}%`}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right text-xs font-mono text-rose-600 dark:text-rose-400">
                          {formatCurrencyBRL(row.irAmount)}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right text-xs font-mono text-amber-600 dark:text-amber-400">
                          {formatCurrencyBRL(row.netInterest)}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrencyBRL(row.netAmount)}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="px-3 py-2 text-right text-xs font-mono text-amber-600 dark:text-amber-400">
                          {formatCurrencyBRL(row.totalInterest)}
                        </TableCell>
                        <TableCell className="px-3 py-2 text-right text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrencyBRL(row.totalAmount)}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {tableMode === "monthly" && activeTableRows.length > 25 && (
            <div className="flex justify-center pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAllMonths((prev) => !prev)}
                className="h-8 sm:h-9 gap-1.5 px-3.5 text-xs font-medium"
              >
                {showAllMonths ? (
                  <>
                    <ChevronUp className="size-3.5" />
                    Recolher tabela (mostrar primeiros 24 meses)
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" />
                    Mostrar todos os {activeTableRows.length - 1} meses
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Seção 3.5: Tabela Regressiva de Imposto de Renda (Renda Fixa) */}
      <Card
        data-testid="ir-brackets-card"
        className="min-w-0 overflow-hidden gap-4 p-4 sm:p-5"
      >
        <CardHeader className="p-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-0.5">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight">
                <Receipt className="size-4 text-primary sm:size-5" />
                Tabela Regressiva de IR (Renda Fixa)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                O Imposto de Renda incide apenas sobre os rendimentos (juros) no
                resgate, conforme o prazo da aplicação ({result.totalMonths}{" "}
                meses ≈ {result.totalMonths * 30} dias).
              </CardDescription>
            </div>

            {taxRegime === "exempt" ? (
              <Badge
                variant="secondary"
                data-testid="ir-exempt-badge"
                className="w-fit gap-1 bg-sky-500/15 px-2.5 py-1 font-mono text-xs text-sky-700 dark:text-sky-300"
              >
                <ShieldCheck className="size-3.5" />
                Isento de IR (0,0%)
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                data-testid="ir-active-rate-badge"
                className="w-fit bg-emerald-500/15 px-2.5 py-1 font-mono text-xs text-emerald-700 dark:text-emerald-300"
              >
                Faixa atual: {formattedActiveIrRate}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 p-0">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {INCOME_TAX_BRACKETS.map((bracket) => {
              const isActive =
                taxRegime === "regressive" &&
                regressiveBracket.id === bracket.id;
              const formattedRate = bracket.ratePercent
                .toFixed(1)
                .replace(".", ",");

              return (
                <div
                  key={bracket.id}
                  data-testid={`ir-bracket-${bracket.id}`}
                  data-active={isActive ? "true" : "false"}
                  className={`rounded-xl border p-3.5 sm:p-4 transition-colors ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/10 shadow-2xs"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`font-mono text-base font-bold ${
                        isActive
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-foreground"
                      }`}
                    >
                      {formattedRate}%
                    </span>
                    {isActive && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-600 px-1.5 py-0 text-xs text-white"
                      >
                        Aplicada
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bracket.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-xl border bg-muted/30 p-3.5 sm:p-4 text-xs sm:grid-cols-3">
            <div className="flex items-center justify-between sm:block sm:space-y-0.5">
              <span className="text-muted-foreground">Valor Total Bruto</span>
              <p className="font-mono font-semibold text-foreground">
                {formatCurrencyBRL(result.finalAmount)}
              </p>
            </div>
            <div className="flex items-center justify-between sm:block sm:space-y-0.5">
              <span className="text-muted-foreground">
                IR Estimado ({formattedActiveIrRate}%)
              </span>
              <p className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                -{formatCurrencyBRL(result.irAmount)}
              </p>
            </div>
            <div className="flex items-center justify-between sm:block sm:space-y-0.5">
              <span className="text-muted-foreground">
                Valor Líquido Final
              </span>
              <p className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {formatCurrencyBRL(result.netFinalAmount)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seção 4: Guia Educativo e Fórmula Passo a Passo */}
      <Card className="gap-4 p-4 sm:p-5">
        <CardHeader className="p-0">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-bold tracking-tight">
            <BookOpen className="size-4 text-primary sm:size-5" />
            Como Funciona o Cálculo de Juros Compostos?
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
            Entenda a matemática financeira aplicada na simulação e acompanhe o
            passo a passo com os seus números.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-0 text-xs sm:text-sm leading-relaxed">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2.5 rounded-xl border bg-muted/30 p-3.5 sm:p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Info className="size-4 text-emerald-500" />
                1. Fórmulas Matemáticas Exatas
              </h3>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Quando há um aporte inicial (<code className="font-mono">P₀</code>)
                combinado com aportes mensais constantes (
                <code className="font-mono">PMT</code>), o Valor Futuro (
                <code className="font-mono">FV</code>) após{" "}
                <code className="font-mono">N</code> meses é dado por:
              </p>
              <div className="overflow-x-auto rounded-lg border bg-background p-2.5 font-mono text-xs">
                FV = P₀ · (1 + iₘ)ᴺ + PMT · [((1 + iₘ)ᴺ - 1) / iₘ]
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                Onde <code className="font-mono">iₘ</code> é a taxa efetiva
                mensal. Quando você informa uma taxa anual (
                <code className="font-mono">iₐ</code>), usamos a equivalência
                exponencial composta exata:
              </p>
              <div className="rounded-lg border bg-background p-2.5 font-mono text-xs font-medium text-emerald-600 dark:text-emerald-400">
                iₘ = (1 + iₐ)^(1/12) - 1
              </div>
            </div>

            <div className="space-y-2.5 rounded-xl border bg-muted/30 p-3.5 sm:p-4">
              <h3 className="text-sm font-semibold text-foreground">
                2. Passo a Passo da Sua Simulação Atual
              </h3>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                <li className="flex items-center justify-between border-b pb-1.5">
                  <span>Capital Inicial (P₀):</span>
                  <strong className="font-mono text-foreground">
                    {formatCurrencyBRL(initialValue)}
                  </strong>
                </li>
                <li className="flex items-center justify-between border-b pb-1.5">
                  <span>Aporte Mensal (PMT):</span>
                  <strong className="font-mono text-foreground">
                    {formatCurrencyBRL(monthlyContribution)}
                  </strong>
                </li>
                <li className="flex items-center justify-between border-b pb-1.5">
                  <span>Taxa Efetiva Mensal (iₘ):</span>
                  <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                    {(result.effectiveMonthlyRate * 100)
                      .toFixed(6)
                      .replace(".", ",")}
                    % a.m.
                  </strong>
                </li>
                <li className="flex items-center justify-between border-b pb-1.5">
                  <span>Taxa Efetiva Anual Equivalente (iₐ):</span>
                  <strong className="font-mono text-foreground">
                    {(result.effectiveAnnualRate * 100)
                      .toFixed(2)
                      .replace(".", ",")}
                    % a.a.
                  </strong>
                </li>
                <li className="flex items-center justify-between border-b pb-1.5">
                  <span>Prazo Total (N):</span>
                  <strong className="font-mono text-foreground">
                    {result.totalMonths} meses
                  </strong>
                </li>
                <li className="flex items-center justify-between border-b pb-1.5">
                  <span>Rendimento do 1º Mês:</span>
                  <strong className="font-mono text-foreground">
                    {formatCurrencyBRL(
                      result.monthlyEvolution[1]?.periodInterest ?? 0
                    )}
                  </strong>
                </li>
                <li className="flex items-center justify-between pt-0.5">
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

          <div className="grid grid-cols-1 gap-4 text-xs sm:text-sm leading-relaxed text-muted-foreground sm:grid-cols-3">
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">
                Juros Simples vs. Compostos
              </h4>
              <p>
                Nos juros simples, a taxa incide apenas sobre o valor principal.
                Nos juros compostos (&ldquo;juros sobre juros&rdquo;), o rendimento de cada
                mês passa a render também nos meses seguintes.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">
                Por que não dividir a taxa anual por 12?
              </h4>
              <p>
                Dividir 12% ao ano por 12 geraria 1% ao mês, que capitalizado
                resulta em 12,68% ao ano. A equivalência composta{" "}
                <code className="font-mono text-xs">(1+i)^(1/12)-1</code> garante
                precisão financeira real.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-semibold text-foreground">
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

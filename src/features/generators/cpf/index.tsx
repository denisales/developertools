"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  FileJson,
  FileSpreadsheet,
  FileText,
  Fingerprint,
  Info,
  Layers,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  BRAZILIAN_STATES,
  type BrazilianState,
  FISCAL_REGIONS,
  formatCpf,
  generateCpf,
  generateCpfBatch,
  getCpfRegion,
  STATE_TO_DIGIT,
  stripCpfDigits,
  validateCpf,
} from "./cpf-utils";

const BULK_PRESETS = [5, 10, 25, 50, 100];

const INITIAL_SAMPLE_CPF = "52998224725";
const INITIAL_BULK_CPFS = [
  "52998224725",
  "11144477735",
  "98765432100",
  "12345678909",
  "45997418077",
  "71428793860",
  "39053344705",
  "84629173620",
  "26384719280",
  "63819204569",
].map((seed) => {
  const res = validateCpf(seed);
  if (res.isValid) return seed;
  const base = seed.slice(0, 9);
  const s1 = base
    .split("")
    .reduce((acc, d, i) => acc + Number(d) * (10 - i), 0);
  const r1 = s1 % 11;
  const dv1 = r1 < 2 ? 0 : 11 - r1;
  const s2 =
    base.split("").reduce((acc, d, i) => acc + Number(d) * (11 - i), 0) +
    dv1 * 2;
  const r2 = s2 % 11;
  const dv2 = r2 < 2 ? 0 : 11 - r2;
  return `${base}${dv1}${dv2}`;
});

export function CpfGeneratorFeature() {
  const [activeTab, setActiveTab] = React.useState<string>("generator");

  // Single Generator State
  const [formatted, setFormatted] = React.useState<boolean>(true);
  const [selectedState, setSelectedState] = React.useState<BrazilianState | "ALL">("ALL");
  const [rawGeneratedCpf, setRawGeneratedCpf] = React.useState<string>(INITIAL_SAMPLE_CPF);
  const [copiedSingle, setCopiedSingle] = React.useState<boolean>(false);
  const [history, setHistory] = React.useState<string[]>([INITIAL_SAMPLE_CPF]);

  // Validator State
  const [validatorInput, setValidatorInput] = React.useState<string>("");

  // Bulk Generator State
  const [bulkQuantity, setBulkQuantity] = React.useState<number>(10);
  const [bulkFormatted, setBulkFormatted] = React.useState<boolean>(true);
  const [bulkState, setBulkState] = React.useState<BrazilianState | "ALL">("ALL");
  const [rawBulkList, setRawBulkList] = React.useState<string[]>(INITIAL_BULK_CPFS);

  const displayedSingleCpf = React.useMemo(() => {
    return formatted ? formatCpf(rawGeneratedCpf) : stripCpfDigits(rawGeneratedCpf);
  }, [rawGeneratedCpf, formatted]);

  const singleRegionDigit = React.useMemo(() => {
    const clean = stripCpfDigits(rawGeneratedCpf);
    return clean.length === 11 ? Number(clean[8]) : null;
  }, [rawGeneratedCpf]);

  const singleRegionInfo = React.useMemo(() => {
    return singleRegionDigit !== null ? getCpfRegion(singleRegionDigit) : null;
  }, [singleRegionDigit]);

  const handleGenerateSingle = React.useCallback(
    (overrideState?: BrazilianState | "ALL") => {
      const targetState = overrideState !== undefined ? overrideState : selectedState;
      const newRaw = generateCpf({
        formatted: false,
        state: targetState === "ALL" ? "" : targetState,
      });
      setRawGeneratedCpf(newRaw);
      setCopiedSingle(false);
      setHistory((prev) => [newRaw, ...prev.filter((item) => item !== newRaw)].slice(0, 5));
    },
    [selectedState]
  );

  const handleCopyText = React.useCallback(async (text: string, label = "CPF") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado para a área de transferência!`, {
        description: text.length > 40 ? `${text.slice(0, 40)}...` : text,
      });
      return true;
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
      return false;
    }
  }, []);

  const handleCopySingle = async () => {
    const ok = await handleCopyText(displayedSingleCpf, "CPF");
    if (ok) {
      setCopiedSingle(true);
      setTimeout(() => setCopiedSingle(false), 2000);
    }
  };

  const handleStateChange = (value: string) => {
    const nextState = value as BrazilianState | "ALL";
    setSelectedState(nextState);
    handleGenerateSingle(nextState);
  };

  const handleValidateCurrentCpf = () => {
    setValidatorInput(formatCpf(rawGeneratedCpf));
    setActiveTab("validator");
  };

  // Validator derived state
  const cleanValidatorDigits = stripCpfDigits(validatorInput);
  const validationResult = React.useMemo(() => {
    if (!cleanValidatorDigits) return null;
    return validateCpf(validatorInput);
  }, [validatorInput, cleanValidatorDigits]);

  const handleValidatorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = stripCpfDigits(raw).slice(0, 11);
    setValidatorInput(formatCpf(digits));
  };

  // Bulk derived state & handlers
  const displayedBulkList = React.useMemo(() => {
    return rawBulkList.map((cpf) =>
      bulkFormatted ? formatCpf(cpf) : stripCpfDigits(cpf)
    );
  }, [rawBulkList, bulkFormatted]);

  const handleGenerateBulk = React.useCallback(
    (qty = bulkQuantity, stateOpt = bulkState) => {
      const clamped = Math.max(1, Math.min(100, qty));
      setBulkQuantity(clamped);
      const batch = generateCpfBatch(clamped, {
        formatted: false,
        state: stateOpt === "ALL" ? "" : stateOpt,
      });
      setRawBulkList(batch);
      toast.success(`${clamped} CPFs gerados com sucesso!`);
    },
    [bulkQuantity, bulkState]
  );

  const handleDownloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`Arquivo ${filename} baixado!`);
  };

  const handleExportTxt = () => {
    const content = displayedBulkList.join("\n");
    handleDownloadFile(
      content,
      `cpfs-${displayedBulkList.length}.txt`,
      "text/plain;charset=utf-8"
    );
  };

  const handleExportCsv = () => {
    const header = "indice,cpf_formatado,cpf_apenas_numeros,nono_digito,regiao_fiscal,estados_uf";
    const rows = rawBulkList.map((raw, idx) => {
      const clean = stripCpfDigits(raw);
      const fmt = formatCpf(clean);
      const d9 = Number(clean[8]);
      const reg = getCpfRegion(d9);
      return `${idx + 1},"${fmt}","${clean}",${d9},"${reg?.name ?? ""}","${reg?.states.join("/") ?? ""}"`;
    });
    const csvContent = [header, ...rows].join("\n");
    handleDownloadFile(
      csvContent,
      `cpfs-${rawBulkList.length}.csv`,
      "text/csv;charset=utf-8"
    );
  };

  const handleExportJson = () => {
    const payload = rawBulkList.map((raw, idx) => {
      const clean = stripCpfDigits(raw);
      const d9 = Number(clean[8]);
      const reg = getCpfRegion(d9);
      return {
        index: idx + 1,
        cpf: bulkFormatted ? formatCpf(clean) : clean,
        formatted: formatCpf(clean),
        digitsOnly: clean,
        regionDigit: d9,
        fiscalRegion: reg?.name ?? "",
        states: reg?.states ?? [],
      };
    });
    handleDownloadFile(
      JSON.stringify(payload, null, 2),
      `cpfs-${rawBulkList.length}.json`,
      "application/json;charset=utf-8"
    );
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      {/* Compact Header (Above the Fold) */}
      <div className="mb-2 flex items-center gap-2.5 sm:gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20 sm:size-10 sm:rounded-xl">
          <Fingerprint className="size-4 sm:size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-2xl">
            Gerador e Validador de CPF
          </h1>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            Gere CPFs válidos para testes, filtre por UF, valide ou exporte em lote.
          </p>
        </div>
      </div>

      {/* Main Interactive Tabs - Single Horizontal Row on Mobile & Desktop */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3 sm:space-y-4">
        <TabsList className="grid h-9 w-full grid-cols-3 rounded-lg bg-muted/80 p-1 sm:h-10 sm:max-w-md">
          <TabsTrigger
            value="generator"
            className="h-full gap-1.5 rounded-md px-2 text-xs font-semibold sm:px-3 sm:text-sm"
          >
            <Sparkles className="size-3.5 shrink-0" />
            <span>Gerar CPF</span>
          </TabsTrigger>
          <TabsTrigger
            value="validator"
            className="h-full gap-1.5 rounded-md px-2 text-xs font-semibold sm:px-3 sm:text-sm"
          >
            <ShieldCheck className="size-3.5 shrink-0" />
            <span>Validar</span>
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="h-full gap-1.5 rounded-md px-2 text-xs font-semibold sm:px-3 sm:text-sm"
          >
            <Layers className="size-3.5 shrink-0" />
            <span>Em Lote</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GERADOR DE CPF */}
        <TabsContent value="generator" className="mt-2 space-y-4 sm:mt-3">
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Unified, Compact Above-the-Fold Generator Card */}
            <Card className="gap-0 p-3.5 sm:p-5 lg:col-span-8">
              {/* Generated CPF Display right at the top of the card */}
              <div className="rounded-xl border border-primary/20 bg-muted/40 p-3 sm:p-4">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    CPF Válido para Testes
                  </span>
                  {singleRegionInfo && (
                    <Badge
                      variant="secondary"
                      className="gap-1 px-2 py-0.5 text-[11px] font-medium"
                    >
                      <MapPin className="size-3 text-primary" />
                      <span>
                        {selectedState === "ALL"
                          ? `9º Dígito ${singleRegionInfo.digit} (${singleRegionInfo.states.slice(0, 3).join("/")}${singleRegionInfo.states.length > 3 ? "…" : ""})`
                          : `UF: ${selectedState} • Dígito ${singleRegionInfo.digit}`}
                      </span>
                    </Badge>
                  )}
                </div>

                <div
                  onClick={handleCopySingle}
                  title="Clique para copiar o CPF"
                  className="cursor-pointer select-all py-1 text-center font-mono text-2xl font-bold tracking-wider text-foreground transition-colors hover:text-primary sm:text-3xl"
                >
                  {displayedSingleCpf}
                </div>

                {/* Action buttons side-by-side */}
                <div className="mt-3 grid grid-cols-2 gap-2.5">
                  <Button
                    onClick={handleCopySingle}
                    className="h-10 gap-2 rounded-lg font-semibold shadow-2xs"
                  >
                    {copiedSingle ? (
                      <>
                        <Check className="size-4 shrink-0" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-4 shrink-0" />
                        <span>Copiar</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateSingle()}
                    aria-label="Gerar novo CPF"
                    className="h-10 gap-2 rounded-lg font-semibold"
                  >
                    <RefreshCw className="size-4 shrink-0" />
                    <span>Gerar Novo</span>
                  </Button>
                </div>
              </div>

              {/* Inline Options Grid inside the same card */}
              <div className="mt-3.5 border-t pt-3.5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {/* Control 1: Estado (UF) compact Select with inline label */}
                  <div className="flex items-center justify-between gap-2.5 rounded-lg border bg-background px-3 py-1.5">
                    <Label
                      htmlFor="cpf-state-select"
                      className="shrink-0 text-xs font-semibold text-foreground sm:text-sm"
                    >
                      Estado (UF)
                    </Label>
                    <Select value={selectedState} onValueChange={handleStateChange}>
                      <SelectTrigger
                        id="cpf-state-select"
                        className="h-9 w-[190px] text-xs sm:w-[210px] sm:text-sm"
                      >
                        <SelectValue placeholder="Aleatório" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Qualquer UF (Aleatório)</SelectItem>
                        {BRAZILIAN_STATES.map((st) => (
                          <SelectItem key={st.uf} value={st.uf}>
                            {st.uf} — {st.name} (Díg. {st.regionDigit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Control 2: Pontuação (000.000.000-00) compact horizontal row */}
                  <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                    <div className="space-y-0.5">
                      <Label
                        htmlFor="cpf-format-switch"
                        className="cursor-pointer text-xs font-semibold text-foreground sm:text-sm"
                      >
                        Pontuação
                      </Label>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {formatted ? "000.000.000-00" : "00000000000"}
                      </p>
                    </div>
                    <Switch
                      id="cpf-format-switch"
                      checked={formatted}
                      onCheckedChange={setFormatted}
                    />
                  </div>
                </div>

                {/* Compact footer link to inspect calculation */}
                <div className="mt-3 flex items-center justify-between gap-2 border-t pt-2.5 text-xs text-muted-foreground">
                  <span className="truncate">
                    {singleRegionInfo
                      ? `${singleRegionInfo.name}: ${singleRegionInfo.states.join(", ")}`
                      : "Regra oficial da Receita Federal"}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleValidateCurrentCpf}
                    className="h-7 shrink-0 gap-1.5 px-2 text-xs font-medium text-primary hover:text-primary"
                  >
                    <ShieldCheck className="size-3.5" />
                    <span>Ver cálculo</span>
                  </Button>
                </div>
              </div>
            </Card>

            {/* Recent Generated CPFs + Quick Stats Card */}
            <Card className="gap-3 p-3.5 sm:p-5 lg:col-span-4">
              <CardHeader className="gap-1 p-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-sm font-bold sm:text-base">
                    Histórico Recente
                  </CardTitle>
                  <Badge variant="outline" className="px-2 py-0.5 font-mono text-xs">
                    {history.length} {history.length === 1 ? "item" : "itens"}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Últimos CPFs gerados nesta sessão. Clique para copiar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 p-0">
                {history.map((itemRaw, idx) => {
                  const displayItem = formatted ? formatCpf(itemRaw) : stripCpfDigits(itemRaw);
                  const d9 = Number(stripCpfDigits(itemRaw)[8]);
                  const reg = getCpfRegion(d9);
                  return (
                    <div
                      key={`${itemRaw}-${idx}`}
                      onClick={() => handleCopyText(displayItem, "CPF")}
                      className="group flex cursor-pointer items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold tracking-wider text-foreground">
                          {displayItem}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          9º dígito: <span className="font-medium text-foreground">{d9}</span> (
                          {reg?.states.slice(0, 3).join(", ")}
                          {(reg?.states.length ?? 0) > 3 ? "…" : ""})
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(displayItem, "CPF");
                        }}
                        aria-label={`Copiar ${displayItem}`}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: VALIDADOR DE CPF */}
        <TabsContent value="validator" className="mt-2 space-y-4 sm:mt-3">
          <Card className="gap-3.5 p-3.5 sm:gap-4 sm:p-5">
            <CardHeader className="gap-1 p-0">
              <CardTitle className="text-base font-bold tracking-tight sm:text-lg">
                Validador de CPF
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Digite ou cole um CPF para verificar os dígitos e a Região Fiscal de emissão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 p-0 sm:space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Input
                    value={validatorInput}
                    onChange={handleValidatorInputChange}
                    placeholder="Digite o CPF (ex: 123.456.789-09)"
                    inputMode="numeric"
                    maxLength={14}
                    className="h-10 px-3 font-mono text-base tracking-wider"
                    aria-label="Número de CPF para validar"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="h-10 flex-1 gap-2 rounded-lg px-3.5 text-xs font-semibold sm:flex-initial sm:text-sm"
                    onClick={() => {
                      const sample = generateCpf({ formatted: true });
                      setValidatorInput(sample);
                    }}
                  >
                    <Sparkles className="size-4 text-primary" />
                    <span>Testar CPF Válido</span>
                  </Button>
                  {validatorInput && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 shrink-0"
                      onClick={() => setValidatorInput("")}
                      aria-label="Limpar campo"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Validation Feedback Banner */}
              {!validationResult ? (
                <div className="rounded-xl border border-dashed bg-muted/20 p-3.5 text-center text-xs leading-relaxed text-muted-foreground sm:p-4 sm:text-sm">
                  Digite os 11 dígitos do CPF acima para conferir o resultado da validação e a
                  memória de cálculo dos dígitos verificadores.
                </div>
              ) : (
                <div className="space-y-3.5 sm:space-y-4">
                  <div
                    className={`flex flex-col gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
                      validationResult.isValid
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {validationResult.isValid ? (
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                      )}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold sm:text-base">
                            {validationResult.isValid ? "CPF Válido" : "CPF Inválido"}
                          </h3>
                          <Badge
                            variant={validationResult.isValid ? "default" : "destructive"}
                            className="px-2 py-0.5 font-mono text-xs"
                          >
                            {validationResult.formattedCpf || validatorInput}
                          </Badge>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90 sm:text-sm">
                          {validationResult.isValid
                            ? "Os dois dígitos verificadores conferem com a regra oficial da Receita Federal."
                            : validationResult.reasonMessage}
                        </p>
                      </div>
                    </div>

                    {validationResult.regionDigit !== null && (
                      <div className="space-y-0.5 rounded-lg border bg-background/90 px-3 py-2 text-xs text-foreground shadow-2xs sm:text-right">
                        <span className="text-[11px] font-medium text-muted-foreground">
                          Região Fiscal (9º Dígito: {validationResult.regionDigit})
                        </span>
                        <p className="text-xs font-bold sm:text-sm">
                          {validationResult.fiscalRegionName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          UFs: {validationResult.states.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step-by-step Check Digit Breakdown */}
                  {validationResult.firstDigitStep && validationResult.secondDigitStep && (
                    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                      {/* 1st Check Digit Card */}
                      <div className="space-y-2.5 rounded-xl border bg-card p-3.5 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold sm:text-sm">
                            1º Dígito Verificador (10º dígito)
                          </span>
                          <Badge
                            variant={
                              validationResult.firstDigitStep.matches
                                ? "default"
                                : "destructive"
                            }
                            className="px-2 py-0.5 text-[11px] font-medium"
                          >
                            Esperado: {validationResult.firstDigitStep.expectedDigit} | Informado:{" "}
                            {validationResult.firstDigitStep.providedDigit}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Soma dos 9 primeiros dígitos multiplicados pelos pesos de 10 a 2:
                        </p>
                        <div className="space-y-1 rounded-lg bg-muted/60 p-2.5 font-mono text-xs">
                          <div>Soma (S₁) = {validationResult.firstDigitStep.sum}</div>
                          <div>
                            Resto da divisão por 11 = {validationResult.firstDigitStep.remainder}
                          </div>
                          <div className="font-semibold text-foreground">
                            DV₁ ={" "}
                            {validationResult.firstDigitStep.remainder < 2
                              ? "0 (pois resto < 2)"
                              : `11 - ${validationResult.firstDigitStep.remainder} = ${validationResult.firstDigitStep.expectedDigit}`}
                          </div>
                        </div>
                      </div>

                      {/* 2nd Check Digit Card */}
                      <div className="space-y-2.5 rounded-xl border bg-card p-3.5 shadow-2xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold sm:text-sm">
                            2º Dígito Verificador (11º dígito)
                          </span>
                          <Badge
                            variant={
                              validationResult.secondDigitStep.matches
                                ? "default"
                                : "destructive"
                            }
                            className="px-2 py-0.5 text-[11px] font-medium"
                          >
                            Esperado: {validationResult.secondDigitStep.expectedDigit} | Informado:{" "}
                            {validationResult.secondDigitStep.providedDigit}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Soma dos 10 primeiros dígitos multiplicados pelos pesos de 11 a 2:
                        </p>
                        <div className="space-y-1 rounded-lg bg-muted/60 p-2.5 font-mono text-xs">
                          <div>Soma (S₂) = {validationResult.secondDigitStep.sum}</div>
                          <div>
                            Resto da divisão por 11 = {validationResult.secondDigitStep.remainder}
                          </div>
                          <div className="font-semibold text-foreground">
                            DV₂ ={" "}
                            {validationResult.secondDigitStep.remainder < 2
                              ? "0 (pois resto < 2)"
                              : `11 - ${validationResult.secondDigitStep.remainder} = ${validationResult.secondDigitStep.expectedDigit}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: GERADOR EM MASSA (BULK) */}
        <TabsContent value="bulk" className="mt-2 space-y-4 sm:mt-3">
          <Card className="gap-3.5 p-3.5 sm:gap-4 sm:p-5">
            <CardHeader className="gap-1 p-0">
              <CardTitle className="text-base font-bold tracking-tight sm:text-lg">
                Gerador de CPF em Lote (1 a 100)
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Gere dezenas de CPFs válidos e exporte em TXT, CSV ou JSON para testes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 p-0 sm:space-y-4">
              {/* Bulk Controls */}
              <div className="grid gap-3 rounded-xl border bg-muted/20 p-3 sm:p-4 lg:grid-cols-3">
                {/* Quantity Input + Quick Pills */}
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-qty-input" className="text-xs font-semibold sm:text-sm">
                    Quantidade (1 a 100)
                  </Label>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Input
                      id="bulk-qty-input"
                      type="number"
                      min={1}
                      max={100}
                      value={bulkQuantity}
                      onChange={(e) =>
                        setBulkQuantity(
                          Math.max(1, Math.min(100, Number(e.target.value) || 1))
                        )
                      }
                      className="h-9 w-16 font-mono text-sm"
                    />
                    <div className="flex flex-wrap gap-1">
                      {BULK_PRESETS.map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant={bulkQuantity === preset ? "default" : "outline"}
                          size="sm"
                          className="h-9 px-2.5 text-xs font-medium"
                          onClick={() => handleGenerateBulk(preset, bulkState)}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* State Filter */}
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-state-select" className="text-xs font-semibold sm:text-sm">
                    Estado de Origem (UF)
                  </Label>
                  <Select
                    value={bulkState}
                    onValueChange={(val) => {
                      const next = val as BrazilianState | "ALL";
                      setBulkState(next);
                      handleGenerateBulk(bulkQuantity, next);
                    }}
                  >
                    <SelectTrigger id="bulk-state-select" className="h-9 w-full text-xs sm:text-sm">
                      <SelectValue placeholder="Qualquer Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Qualquer Estado (Aleatório)</SelectItem>
                      {BRAZILIAN_STATES.map((st) => (
                        <SelectItem key={st.uf} value={st.uf}>
                          {st.uf} — {st.name} (Dígito {st.regionDigit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Punctuation + Action */}
                <div className="flex flex-col justify-between gap-2">
                  <div className="flex h-9 items-center justify-between rounded-lg border bg-background px-3">
                    <Label htmlFor="bulk-format-switch" className="text-xs font-semibold">
                      Incluir pontuação
                    </Label>
                    <Switch
                      id="bulk-format-switch"
                      checked={bulkFormatted}
                      onCheckedChange={setBulkFormatted}
                    />
                  </div>
                  <Button
                    onClick={() => handleGenerateBulk(bulkQuantity, bulkState)}
                    className="h-9 w-full gap-2 rounded-lg px-4 text-xs font-semibold sm:text-sm"
                  >
                    <RefreshCw className="size-3.5" />
                    <span>Gerar {bulkQuantity} CPFs</span>
                  </Button>
                </div>
              </div>

              {/* Bulk Toolbar & List */}
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs font-semibold text-foreground sm:text-sm">
                    {displayedBulkList.length} CPFs gerados
                    {bulkState !== "ALL"
                      ? ` para ${bulkState} (9º dígito ${STATE_TO_DIGIT[bulkState]})`
                      : ""}
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopyText(
                          displayedBulkList.join("\n"),
                          `${displayedBulkList.length} CPFs`
                        )
                      }
                      className="h-9 gap-1.5 text-xs font-medium"
                    >
                      <Copy className="size-3.5" />
                      <span>Copiar Todos</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportTxt}
                      className="h-9 gap-1.5 text-xs font-medium"
                    >
                      <FileText className="size-3.5" />
                      <span>.TXT</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCsv}
                      className="h-9 gap-1.5 text-xs font-medium"
                    >
                      <FileSpreadsheet className="size-3.5" />
                      <span>.CSV</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportJson}
                      className="h-9 gap-1.5 text-xs font-medium"
                    >
                      <FileJson className="size-3.5" />
                      <span>.JSON</span>
                    </Button>
                  </div>
                </div>

                <div className="grid max-h-72 grid-cols-1 gap-2 overflow-y-auto rounded-xl border bg-muted/20 p-3 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
                  {displayedBulkList.map((cpfItem, idx) => (
                    <div
                      key={`${cpfItem}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 font-mono text-xs shadow-2xs transition-colors hover:border-primary/40 sm:text-sm"
                    >
                      <span className="w-6 font-mono text-[11px] text-muted-foreground">
                        #{idx + 1}
                      </span>
                      <span className="flex-1 font-mono font-semibold tracking-wide">
                        {cpfItem}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0"
                        onClick={() => handleCopyText(cpfItem, `CPF #${idx + 1}`)}
                        aria-label={`Copiar ${cpfItem}`}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Educational Section: Check Digits & 9th Digit Fiscal Regions */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="gap-3.5 p-3.5 sm:p-5 lg:col-span-5">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
              <Info className="size-4 text-primary" />
              <span>Como funciona o cálculo do CPF?</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Entenda a estrutura dos dígitos verificadores adotada pela Receita Federal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-0 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            <p>
              O Cadastro de Pessoas Físicas (CPF) é formado por{" "}
              <strong className="text-foreground">11 dígitos decimais</strong> no formato{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                d₁d₂d₃.d₄d₅d₆.d₇d₈d₉-dv₁dv₂
              </code>
              .
            </p>
            <div className="space-y-1 rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed">
              <p className="font-semibold text-foreground">
                1. Cálculo do 1º Dígito Verificador (dv₁):
              </p>
              <p>
                Multiplicam-se os 9 primeiros dígitos pelos pesos decrescentes de{" "}
                <strong className="text-foreground">10 a 2</strong> e soma-se tudo (
                <code className="font-mono text-foreground">S₁</code>). Calcula-se o resto{" "}
                <code className="font-mono text-foreground">R₁</code> da divisão de{" "}
                <code className="font-mono text-foreground">S₁</code> por 11. Se{" "}
                <code className="font-mono text-foreground">R₁ &lt; 2</code>, então{" "}
                <code className="font-mono text-foreground">dv₁ = 0</code>; caso contrário,{" "}
                <code className="font-mono text-foreground">dv₁ = 11 - R₁</code>.
              </p>
            </div>
            <div className="space-y-1 rounded-xl border bg-muted/30 p-3 text-xs leading-relaxed">
              <p className="font-semibold text-foreground">
                2. Cálculo do 2º Dígito Verificador (dv₂):
              </p>
              <p>
                Inclui-se <code className="font-mono text-foreground">dv₁</code> como 10º dígito e
                multiplicam-se os 10 dígitos pelos pesos de{" "}
                <strong className="text-foreground">11 a 2</strong> (
                <code className="font-mono text-foreground">S₂</code>). Para o resto{" "}
                <code className="font-mono text-foreground">R₂</code> da divisão por 11, se{" "}
                <code className="font-mono text-foreground">R₂ &lt; 2</code> temos{" "}
                <code className="font-mono text-foreground">dv₂ = 0</code>; senão{" "}
                <code className="font-mono text-foreground">dv₂ = 11 - R₂</code>.
              </p>
            </div>
            <p className="text-xs">
              <strong className="text-foreground">Nota Importante:</strong> Os CPFs gerados por
              esta ferramenta são números fictícios destinados exclusivamente a testes de
              desenvolvimento de software, QA e homologação.
            </p>
          </CardContent>
        </Card>

        <Card className="gap-3.5 p-3.5 sm:p-5 lg:col-span-7">
          <CardHeader className="gap-1 p-0">
            <CardTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
              <MapPin className="size-4 text-primary" />
              <span>Tabela Oficial do 9º Dígito — Regiões Fiscais (UF)</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              O nono algarismo do CPF identifica a Região Fiscal de emissão. Clique em uma UF para
              gerar um CPF daquele estado.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => {
                const region = FISCAL_REGIONS[digit];
                return (
                  <div
                    key={digit}
                    className="flex flex-col justify-between gap-2 rounded-xl border bg-muted/20 p-3 transition-colors hover:border-primary/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-foreground sm:text-sm">
                          {region.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {region.description}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 px-2 py-0.5 font-mono text-[11px] font-bold text-primary"
                      >
                        Dígito {digit}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {region.states.map((uf) => (
                        <Badge
                          key={uf}
                          variant={selectedState === uf ? "default" : "outline"}
                          className="cursor-pointer px-2 py-0.5 font-mono text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
                          onClick={() => {
                            setSelectedState(uf);
                            handleGenerateSingle(uf);
                            setActiveTab("generator");
                          }}
                          title={`Gerar CPF de ${uf}`}
                        >
                          {uf}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CpfGeneratorFeature;
export * from "./cpf-utils";

"use client";

import * as React from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
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
  CardFooter,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  // Fallback deterministic Mod-11 calculation for the first 9 digits
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
      setHistory((prev) => [newRaw, ...prev.filter((item) => item !== newRaw)].slice(0, 6));
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
    handleDownloadFile(content, `cpfs-${displayedBulkList.length}.txt`, "text/plain;charset=utf-8");
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
    handleDownloadFile(csvContent, `cpfs-${rawBulkList.length}.csv`, "text/csv;charset=utf-8");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <Fingerprint className="size-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Gerador e Validador de CPF
              </h1>
              <Badge variant="default" className="text-[11px]">
                Módulo 11 Oficial
              </Badge>
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Gere números de CPF matematicamente válidos por Região Fiscal (UF), valide
              dígitos verificadores passo a passo ou exporte lotes para testes de software.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 p-1 sm:w-fit sm:inline-flex">
          <TabsTrigger value="generator" className="py-2 text-xs sm:text-sm">
            <Sparkles className="size-4 shrink-0" />
            <span>Gerador de CPF</span>
          </TabsTrigger>
          <TabsTrigger value="validator" className="py-2 text-xs sm:text-sm">
            <ShieldCheck className="size-4 shrink-0" />
            <span>Validador de CPF</span>
          </TabsTrigger>
          <TabsTrigger value="bulk" className="py-2 text-xs sm:text-sm">
            <Layers className="size-4 shrink-0" />
            <span>Gerador em Massa</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GERADOR DE CPF */}
        <TabsContent value="generator" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Main Display + Controls */}
            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>Gerar CPF Válido</span>
                  {singleRegionInfo && (
                    <Badge variant="secondary" className="gap-1 font-normal">
                      <MapPin className="size-3 text-primary" />
                      9º Dígito {singleRegionInfo.digit} • {singleRegionInfo.name}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Configure a pontuação e o estado de origem para gerar um CPF instantaneamente.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Big CPF Display Screen */}
                <div className="relative overflow-hidden rounded-2xl border bg-muted/40 p-5 sm:p-7">
                  <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="text-center sm:text-left">
                      <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        CPF Gerado para Testes
                      </span>
                      <div
                        onClick={handleCopySingle}
                        title="Clique para copiar"
                        className="mt-1 cursor-pointer font-mono text-2xl font-bold tracking-wider text-foreground transition-colors hover:text-primary sm:text-4xl"
                      >
                        {displayedSingleCpf}
                      </div>
                      {singleRegionInfo && (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Estados da região:{" "}
                          <span className="font-medium text-foreground">
                            {singleRegionInfo.states.join(", ")}
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex w-full shrink-0 gap-2.5 sm:w-auto">
                      <Button
                        size="lg"
                        onClick={handleCopySingle}
                        className="flex-1 gap-2 sm:flex-initial"
                      >
                        {copiedSingle ? (
                          <>
                            <Check className="size-4" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            Copiar CPF
                          </>
                        )}
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleGenerateSingle()}
                        aria-label="Gerar novo CPF"
                        className="gap-2"
                      >
                        <RefreshCw className="size-4" />
                        <span className=" sm:inline">Gerar Outro</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Options Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* State (UF) Selector */}
                  <div className="space-y-2 rounded-xl border p-4">
                    <Label htmlFor="cpf-state-select" className="text-sm font-medium">
                      Estado de Origem (UF)
                    </Label>
                    <Select value={selectedState} onValueChange={handleStateChange}>
                      <SelectTrigger id="cpf-state-select" className="w-full">
                        <SelectValue placeholder="Qualquer Estado (Aleatório)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">
                          Qualquer Estado (Aleatório 0–9)
                        </SelectItem>
                        {BRAZILIAN_STATES.map((st) => (
                          <SelectItem key={st.uf} value={st.uf}>
                            {st.uf} — {st.name} (Dígito {st.regionDigit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Define o 9º dígito conforme a Região Fiscal da Receita Federal.
                    </p>
                  </div>

                  {/* Formatting Switch */}
                  <div className="flex flex-col justify-between rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <Label htmlFor="cpf-format-switch" className="text-sm font-medium">
                          Gerar com pontuação?
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Alterna entre{" "}
                          <code className="rounded bg-muted px-1 py-0.5">000.000.000-00</code> e{" "}
                          <code className="rounded bg-muted px-1 py-0.5">00000000000</code>
                        </p>
                      </div>
                      <Switch
                        id="cpf-format-switch"
                        checked={formatted}
                        onCheckedChange={setFormatted}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
                      <span>Formato ativo:</span>
                      <Badge variant="outline" className="font-mono text-[11px]">
                        {formatted ? "Com máscara (14 chars)" : "Apenas dígitos (11 chars)"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t bg-muted/20 px-6 py-3.5">
                <span className="text-xs text-muted-foreground">
                  Deseja inspecionar o cálculo dos dígitos deste CPF?
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleValidateCurrentCpf}
                  className="gap-1.5 text-xs"
                >
                  <ShieldCheck className="size-3.5 text-primary" />
                  Ver cálculo passo a passo no Validador
                </Button>
              </CardFooter>
            </Card>

            {/* Recent Generated CPFs Card */}
            <Card className="lg:col-span-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Histórico Recente</CardTitle>
                <CardDescription className="text-xs">
                  Últimos CPFs gerados nesta sessão. Toque para copiar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {history.map((itemRaw, idx) => {
                  const displayItem = formatted ? formatCpf(itemRaw) : stripCpfDigits(itemRaw);
                  const d9 = Number(stripCpfDigits(itemRaw)[8]);
                  const reg = getCpfRegion(d9);
                  return (
                    <div
                      key={`${itemRaw}-${idx}`}
                      className="group flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm transition-colors hover:border-primary/40 hover:bg-muted/40"
                    >
                      <div>
                        <p className="font-mono font-medium">{displayItem}</p>
                        <p className="text-[11px] text-muted-foreground">
                          9º dígito: {d9} ({reg?.states.slice(0, 3).join(", ")}
                          {(reg?.states.length ?? 0) > 3 ? "…" : ""})
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleCopyText(displayItem, "CPF")}
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
        <TabsContent value="validator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Validador de CPF (Módulo 11)</CardTitle>
              <CardDescription>
                Digite ou cole qualquer número de CPF (com ou sem pontuação) para verificar sua
                autenticidade matemática e descobrir a Região Fiscal de emissão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Input
                    value={validatorInput}
                    onChange={handleValidatorInputChange}
                    placeholder="Digite o CPF (ex: 123.456.789-09)"
                    inputMode="numeric"
                    maxLength={14}
                    className="h-12 font-mono text-lg tracking-wider"
                    aria-label="Número de CPF para validar"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="h-12 gap-2"
                    onClick={() => {
                      const sample = generateCpf({ formatted: true });
                      setValidatorInput(sample);
                    }}
                  >
                    <Sparkles className="size-4" />
                    Testar com CPF Válido
                  </Button>
                  {validatorInput && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-12 shrink-0"
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
                <div className="rounded-xl border border-dashed bg-muted/20 p-6 text-center text-sm text-muted-foreground">
                  Digite os 11 dígitos do CPF acima para ver o resultado detalhado da validação e
                  a memória de cálculo dos dígitos verificadores.
                </div>
              ) : (
                <div className="space-y-6">
                  <div
                    className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
                      validationResult.isValid
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      {validationResult.isValid ? (
                        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <XCircle className="mt-0.5 size-6 shrink-0 text-destructive" />
                      )}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold">
                            {validationResult.isValid
                              ? "CPF Matematicamente Válido"
                              : "CPF Inválido"}
                          </h3>
                          <Badge
                            variant={validationResult.isValid ? "default" : "destructive"}
                            className="font-mono"
                          >
                            {validationResult.formattedCpf || validatorInput}
                          </Badge>
                        </div>
                        <p className="text-sm opacity-90">
                          {validationResult.isValid
                            ? "Os dois dígitos verificadores conferem com o algoritmo oficial Módulo 11 da Receita Federal."
                            : validationResult.reasonMessage}
                        </p>
                      </div>
                    </div>

                    {validationResult.regionDigit !== null && (
                      <div className="rounded-xl border bg-background/80 p-3 text-xs text-foreground shadow-2xs sm:text-right">
                        <span className="text-muted-foreground">Região Fiscal (9º Dígito: {validationResult.regionDigit})</span>
                        <p className="font-semibold">{validationResult.fiscalRegionName}</p>
                        <p className="text-muted-foreground">
                          UFs: {validationResult.states.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step-by-step Check Digit Breakdown */}
                  {validationResult.firstDigitStep && validationResult.secondDigitStep && (
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* 1st Check Digit Card */}
                      <div className="rounded-xl border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            1º Dígito Verificador (10º dígito)
                          </span>
                          <Badge
                            variant={
                              validationResult.firstDigitStep.matches
                                ? "default"
                                : "destructive"
                            }
                          >
                            Esperado: {validationResult.firstDigitStep.expectedDigit} | Informado:{" "}
                            {validationResult.firstDigitStep.providedDigit}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Soma dos 9 primeiros dígitos multiplicados pelos pesos de 10 a 2:
                        </p>
                        <div className="rounded-lg bg-muted/60 p-2.5 font-mono text-xs space-y-1">
                          <div>Soma (S₁) = {validationResult.firstDigitStep.sum}</div>
                          <div>
                            Resto (S₁ mod 11) = {validationResult.firstDigitStep.remainder}
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
                      <div className="rounded-xl border bg-card p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            2º Dígito Verificador (11º dígito)
                          </span>
                          <Badge
                            variant={
                              validationResult.secondDigitStep.matches
                                ? "default"
                                : "destructive"
                            }
                          >
                            Esperado: {validationResult.secondDigitStep.expectedDigit} | Informado:{" "}
                            {validationResult.secondDigitStep.providedDigit}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Soma dos 10 primeiros dígitos multiplicados pelos pesos de 11 a 2:
                        </p>
                        <div className="rounded-lg bg-muted/60 p-2.5 font-mono text-xs space-y-1">
                          <div>Soma (S₂) = {validationResult.secondDigitStep.sum}</div>
                          <div>
                            Resto (S₂ mod 11) = {validationResult.secondDigitStep.remainder}
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
        <TabsContent value="bulk" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gerador de CPF em Massa (1 a 100)</CardTitle>
              <CardDescription>
                Gere dezenas de CPFs únicos de uma só vez e exporte em TXT ou CSV para popular
                bancos de dados de homologação e testes automatizados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bulk Controls */}
              <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:grid-cols-3">
                {/* Quantity Input + Quick Pills */}
                <div className="space-y-2">
                  <Label htmlFor="bulk-qty-input">Quantidade (1 a 100)</Label>
                  <div className="flex items-center gap-2">
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
                      className="w-24 font-mono"
                    />
                    <div className="flex flex-wrap gap-1">
                      {BULK_PRESETS.map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant={bulkQuantity === preset ? "default" : "outline"}
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleGenerateBulk(preset, bulkState)}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* State Filter */}
                <div className="space-y-2">
                  <Label htmlFor="bulk-state-select">Estado de Origem (UF)</Label>
                  <Select
                    value={bulkState}
                    onValueChange={(val) => {
                      const next = val as BrazilianState | "ALL";
                      setBulkState(next);
                      handleGenerateBulk(bulkQuantity, next);
                    }}
                  >
                    <SelectTrigger id="bulk-state-select" className="w-full">
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
                <div className="flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
                    <Label htmlFor="bulk-format-switch" className="text-xs font-medium">
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
                    className="w-full gap-2"
                  >
                    <RefreshCw className="size-4" />
                    Gerar {bulkQuantity} CPFs
                  </Button>
                </div>
              </div>

              {/* Bulk Toolbar & List */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {displayedBulkList.length} CPFs gerados
                    {bulkState !== "ALL"
                      ? ` para ${bulkState} (9º dígito ${STATE_TO_DIGIT[bulkState]})`
                      : ""}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        handleCopyText(
                          displayedBulkList.join("\n"),
                          `${displayedBulkList.length} CPFs`
                        )
                      }
                      className="gap-1.5"
                    >
                      <Copy className="size-3.5" />
                      Copiar Todos
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportTxt}
                      className="gap-1.5"
                    >
                      <FileText className="size-3.5" />
                      Baixar .TXT
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCsv}
                      className="gap-1.5"
                    >
                      <FileSpreadsheet className="size-3.5" />
                      Baixar .CSV
                    </Button>
                  </div>
                </div>

                <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto rounded-xl border bg-muted/20 p-3 sm:grid-cols-2 md:grid-cols-3">
                  {displayedBulkList.map((cpfItem, idx) => (
                    <div
                      key={`${cpfItem}-${idx}`}
                      className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs shadow-2xs"
                    >
                      <span className="text-muted-foreground mr-2 w-6 font-mono">
                        #{idx + 1}
                      </span>
                      <span className="flex-1 font-mono font-medium">{cpfItem}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => handleCopyText(cpfItem, `CPF #${idx + 1}`)}
                        aria-label={`Copiar ${cpfItem}`}
                      >
                        <Copy className="size-3" />
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

      {/* Educational Section: Mod-11 & 9th Digit Fiscal Region Table */}
      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="size-4 text-primary" />
              Como funciona o Algoritmo Módulo 11 do CPF?
            </CardTitle>
            <CardDescription>
              Entenda a regra matemática usada pela Receita Federal do Brasil.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              O Cadastro de Pessoas Físicas (CPF) é formado por{" "}
              <strong className="text-foreground">11 dígitos decimais</strong> no formato{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-foreground">
                d₁d₂d₃.d₄d₅d₆.d₇d₈d₉-dv₁dv₂
              </code>
              .
            </p>
            <div className="space-y-2 rounded-xl border bg-muted/30 p-3.5 text-xs">
              <p className="font-semibold text-foreground">1. Cálculo do 1º Dígito (dv₁):</p>
              <p>
                Multiplicam-se os 9 primeiros dígitos pelos pesos decrescentes de{" "}
                <strong>10 a 2</strong> e soma-se tudo (<code className="font-mono">S₁</code>).
                Calcula-se o resto <code className="font-mono">R₁ = S₁ mod 11</code>. Se{" "}
                <code className="font-mono">R₁ &lt; 2</code>, então{" "}
                <code className="font-mono">dv₁ = 0</code>; caso contrário,{" "}
                <code className="font-mono">dv₁ = 11 - R₁</code>.
              </p>
            </div>
            <div className="space-y-2 rounded-xl border bg-muted/30 p-3.5 text-xs">
              <p className="font-semibold text-foreground">2. Cálculo do 2º Dígito (dv₂):</p>
              <p>
                Inclui-se <code className="font-mono">dv₁</code> como 10º dígito e multiplicam-se
                os 10 dígitos pelos pesos de <strong>11 a 2</strong> (<code className="font-mono">S₂</code>).
                Novamente, para <code className="font-mono">R₂ = S₂ mod 11</code>, se{" "}
                <code className="font-mono">R₂ &lt; 2</code> temos{" "}
                <code className="font-mono">dv₂ = 0</code>; senão{" "}
                <code className="font-mono">dv₂ = 11 - R₂</code>.
              </p>
            </div>
            <p className="text-xs">
              <strong>Nota Importante:</strong> Os CPFs gerados por esta ferramenta são números
              fictícios destinados exclusivamente a testes de desenvolvimento de software, QA e
              homologação.
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="size-4 text-primary" />
              Tabela Oficial do 9º Dígito — Regiões Fiscais (UF)
            </CardTitle>
            <CardDescription>
              O nono algarismo do CPF identifica a Região Fiscal onde o documento foi emitido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24 text-center">9º Dígito</TableHead>
                  <TableHead>Região Fiscal</TableHead>
                  <TableHead>Siglas (UFs)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => {
                  const region = FISCAL_REGIONS[digit];
                  return (
                    <TableRow key={digit}>
                      <TableCell className="text-center font-mono font-bold text-primary">
                        {digit}
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm">
                        {region.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {region.states.map((uf) => (
                            <Badge
                              key={uf}
                              variant="outline"
                              className="cursor-pointer font-mono text-[11px] hover:bg-primary hover:text-primary-foreground"
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default CpfGeneratorFeature;
export * from "./cpf-utils";

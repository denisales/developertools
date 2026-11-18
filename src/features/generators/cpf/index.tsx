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
    <div className="w-full space-y-5">
      {/* Page Header Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 shadow-2xs">
            <Fingerprint className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Gerador e Validador de CPF
              </h1>
            </div>
            <p className="max-w-3xl text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Gere CPFs válidos para testes de software com opção de pontuação e estado de origem,
              valide números existentes ou exporte lotes rapidamente.
            </p>
          </div>
        </div>
      </div>

      {/* Main Interactive Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-1 rounded-lg bg-muted/80 p-1 sm:inline-flex sm:h-10 sm:w-auto sm:grid-cols-none">
          <TabsTrigger
            value="generator"
            className="h-8 gap-2 rounded-md px-3.5 text-xs font-semibold sm:h-full sm:text-sm"
          >
            <Sparkles className="size-3.5 shrink-0" />
            <span>Gerador de CPF</span>
          </TabsTrigger>
          <TabsTrigger
            value="validator"
            className="h-8 gap-2 rounded-md px-3.5 text-xs font-semibold sm:h-full sm:text-sm"
          >
            <ShieldCheck className="size-3.5 shrink-0" />
            <span>Validador de CPF</span>
          </TabsTrigger>
          <TabsTrigger
            value="bulk"
            className="h-8 gap-2 rounded-md px-3.5 text-xs font-semibold sm:h-full sm:text-sm"
          >
            <Layers className="size-3.5 shrink-0" />
            <span>Gerador em Massa</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GERADOR DE CPF */}
        <TabsContent value="generator" className="mt-4 space-y-5">
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
            {/* Main Display + Controls */}
            <Card className="gap-4 p-4 sm:gap-5 sm:p-5 lg:col-span-8">
              <CardHeader className="gap-1.5 p-0">
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <CardTitle className="text-lg font-bold tracking-tight sm:text-xl">
                    Gerar CPF Válido
                  </CardTitle>
                  {singleRegionInfo && (
                    <Badge
                      variant="secondary"
                      className="gap-1.5 px-2.5 py-0.5 text-xs font-medium"
                    >
                      <MapPin className="size-3.5 text-primary" />
                      <span>
                        9º Dígito {singleRegionInfo.digit} • {singleRegionInfo.name}
                      </span>
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-xs leading-relaxed sm:text-sm">
                  Configure a pontuação e o estado de origem para gerar um CPF instantaneamente.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-0 sm:space-y-5">
                {/* Hero CPF Display Screen */}
                <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-muted/40 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1.5 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                        <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                          CPF Gerado para Testes
                        </span>
                        <Badge variant="outline" className="px-2 py-0.5 text-xs font-medium">
                          {selectedState === "ALL" ? "UF Aleatória" : `UF: ${selectedState}`}
                        </Badge>
                      </div>

                      <div
                        onClick={handleCopySingle}
                        title="Clique para copiar o CPF"
                        className="cursor-pointer select-all font-mono text-2xl font-bold tracking-wider text-foreground transition-colors hover:text-primary sm:text-3xl"
                      >
                        {displayedSingleCpf}
                      </div>

                      {singleRegionInfo && (
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Região Fiscal:{" "}
                          <span className="font-semibold text-foreground">
                            {singleRegionInfo.states.join(", ")}
                          </span>{" "}
                          <span className="hidden xl:inline">
                            ({singleRegionInfo.description})
                          </span>
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                      <Button
                        onClick={handleCopySingle}
                        className="h-10 gap-2 px-4 text-sm font-medium shadow-2xs"
                      >
                        {copiedSingle ? (
                          <>
                            <Check className="size-4" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            <span>Copiar CPF</span>
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleGenerateSingle()}
                        aria-label="Gerar novo CPF"
                        className="h-10 gap-2 px-4 text-sm font-medium"
                      >
                        <RefreshCw className="size-4" />
                        <span>Gerar Novo CPF</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Configuration Controls Grid */}
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                  {/* State (UF) Selector */}
                  <div className="flex flex-col justify-between space-y-3 rounded-xl border bg-card p-3.5 shadow-2xs sm:p-4">
                    <div className="space-y-1">
                      <Label
                        htmlFor="cpf-state-select"
                        className="text-sm font-semibold text-foreground"
                      >
                        Estado de Origem (UF)
                      </Label>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Define o 9º dígito conforme a Região Fiscal oficial da Receita Federal.
                      </p>
                    </div>
                    <Select value={selectedState} onValueChange={handleStateChange}>
                      <SelectTrigger id="cpf-state-select" className="h-10 w-full text-sm">
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
                  </div>

                  {/* Formatting Switch */}
                  <div className="flex flex-col justify-between space-y-3 rounded-xl border bg-card p-3.5 shadow-2xs sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Label
                          htmlFor="cpf-format-switch"
                          className="text-sm font-semibold text-foreground"
                        >
                          Gerar com pontuação?
                        </Label>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Alterna entre{" "}
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                            000.000.000-00
                          </code>{" "}
                          e{" "}
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                            00000000000
                          </code>
                        </p>
                      </div>
                      <Switch
                        id="cpf-format-switch"
                        checked={formatted}
                        onCheckedChange={setFormatted}
                      />
                    </div>
                    <div className="flex items-center justify-between border-t pt-2.5 text-xs text-muted-foreground">
                      <span>Formato ativo:</span>
                      <Badge variant="outline" className="px-2 py-0.5 font-mono text-xs">
                        {formatted ? "Com máscara (14 chars)" : "Apenas dígitos (11 chars)"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex flex-col items-start justify-between gap-3 border-t p-0 pt-4 sm:flex-row sm:items-center">
                <span className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  Deseja inspecionar o cálculo passo a passo dos dígitos deste CPF?
                </span>
                <Button
                  variant="secondary"
                  size="default"
                  onClick={handleValidateCurrentCpf}
                  className="h-10 gap-2 px-4 text-sm font-medium"
                >
                  <ShieldCheck className="size-4 text-primary" />
                  <span>Ver cálculo no Validador</span>
                </Button>
              </CardFooter>
            </Card>

            {/* Recent Generated CPFs + Quick Stats Card */}
            <Card className="gap-4 p-4 sm:gap-5 sm:p-5 lg:col-span-4">
              <CardHeader className="gap-1 p-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-bold sm:text-lg">
                    Histórico Recente
                  </CardTitle>
                  <Badge variant="outline" className="px-2 py-0.5 font-mono text-xs">
                    {history.length} {history.length === 1 ? "item" : "itens"}
                  </Badge>
                </div>
                <CardDescription className="text-xs leading-relaxed">
                  Últimos CPFs gerados nesta sessão. Clique para copiar.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 p-0">
                {history.map((itemRaw, idx) => {
                  const displayItem = formatted ? formatCpf(itemRaw) : stripCpfDigits(itemRaw);
                  const d9 = Number(stripCpfDigits(itemRaw)[8]);
                  const reg = getCpfRegion(d9);
                  return (
                    <div
                      key={`${itemRaw}-${idx}`}
                      onClick={() => handleCopyText(displayItem, "CPF")}
                      className="group flex cursor-pointer items-center justify-between gap-2.5 rounded-xl border bg-background p-3.5 transition-colors hover:border-primary/40 hover:bg-muted/40 sm:p-4"
                    >
                      <div className="space-y-0.5">
                        <p className="font-mono text-sm font-semibold tracking-wider text-foreground">
                          {displayItem}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          9º dígito: <span className="font-medium text-foreground">{d9}</span> (
                          {reg?.states.slice(0, 3).join(", ")}
                          {(reg?.states.length ?? 0) > 3 ? "…" : ""})
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(displayItem, "CPF");
                        }}
                        aria-label={`Copiar ${displayItem}`}
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: VALIDADOR DE CPF */}
        <TabsContent value="validator" className="mt-4 space-y-5">
          <Card className="gap-4 p-4 sm:gap-5 sm:p-5">
            <CardHeader className="gap-1.5 p-0">
              <CardTitle className="text-lg font-bold tracking-tight sm:text-xl">
                Validador de CPF
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed sm:text-sm">
                Digite ou cole qualquer número de CPF (com ou sem pontuação) para verificar sua
                validade e identificar a Região Fiscal de emissão.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0 sm:space-y-5">
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Input
                    value={validatorInput}
                    onChange={handleValidatorInputChange}
                    placeholder="Digite o CPF (ex: 123.456.789-09)"
                    inputMode="numeric"
                    maxLength={14}
                    className="h-10 px-3.5 font-mono text-base tracking-wider"
                    aria-label="Número de CPF para validar"
                  />
                </div>
                <div className="flex items-center gap-2.5">
                  <Button
                    variant="outline"
                    className="h-10 flex-1 gap-2 px-4 text-sm font-medium sm:flex-initial"
                    onClick={() => {
                      const sample = generateCpf({ formatted: true });
                      setValidatorInput(sample);
                    }}
                  >
                    <Sparkles className="size-4 text-primary" />
                    <span>Testar com CPF Válido</span>
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
                <div className="rounded-xl border border-dashed bg-muted/20 p-4 text-center text-xs leading-relaxed text-muted-foreground sm:p-5 sm:text-sm">
                  Digite os 11 dígitos do CPF no campo acima para ver o resultado detalhado da
                  validação e a memória de cálculo dos dois dígitos verificadores.
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-5">
                  <div
                    className={`flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
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
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="text-base font-bold sm:text-lg">
                            {validationResult.isValid
                              ? "CPF Válido"
                              : "CPF Inválido"}
                          </h3>
                          <Badge
                            variant={validationResult.isValid ? "default" : "destructive"}
                            className="px-2.5 py-0.5 font-mono text-xs"
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
                      <div className="space-y-0.5 rounded-xl border bg-background/90 p-3.5 text-xs text-foreground shadow-2xs sm:p-4 sm:text-right">
                        <span className="text-xs font-medium text-muted-foreground">
                          Região Fiscal (9º Dígito: {validationResult.regionDigit})
                        </span>
                        <p className="text-sm font-bold">{validationResult.fiscalRegionName}</p>
                        <p className="text-xs text-muted-foreground">
                          UFs: {validationResult.states.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Step-by-step Check Digit Breakdown */}
                  {validationResult.firstDigitStep && validationResult.secondDigitStep && (
                    <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
                      {/* 1st Check Digit Card */}
                      <div className="space-y-3 rounded-xl border bg-card p-3.5 shadow-2xs sm:p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold">
                            1º Dígito Verificador (10º dígito)
                          </span>
                          <Badge
                            variant={
                              validationResult.firstDigitStep.matches
                                ? "default"
                                : "destructive"
                            }
                            className="px-2.5 py-0.5 text-xs font-medium"
                          >
                            Esperado: {validationResult.firstDigitStep.expectedDigit} | Informado:{" "}
                            {validationResult.firstDigitStep.providedDigit}
                          </Badge>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Soma dos 9 primeiros dígitos multiplicados pelos pesos decrescentes de 10
                          a 2:
                        </p>
                        <div className="space-y-1.5 rounded-lg bg-muted/60 p-3 font-mono text-xs leading-relaxed">
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
                      <div className="space-y-3 rounded-xl border bg-card p-3.5 shadow-2xs sm:p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold">
                            2º Dígito Verificador (11º dígito)
                          </span>
                          <Badge
                            variant={
                              validationResult.secondDigitStep.matches
                                ? "default"
                                : "destructive"
                            }
                            className="px-2.5 py-0.5 text-xs font-medium"
                          >
                            Esperado: {validationResult.secondDigitStep.expectedDigit} | Informado:{" "}
                            {validationResult.secondDigitStep.providedDigit}
                          </Badge>
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          Soma dos 10 primeiros dígitos multiplicados pelos pesos decrescentes de 11
                          a 2:
                        </p>
                        <div className="space-y-1.5 rounded-lg bg-muted/60 p-3 font-mono text-xs leading-relaxed">
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
        <TabsContent value="bulk" className="mt-4 space-y-5">
          <Card className="gap-4 p-4 sm:gap-5 sm:p-5">
            <CardHeader className="gap-1.5 p-0">
              <CardTitle className="text-lg font-bold tracking-tight sm:text-xl">
                Gerador de CPF em Massa (1 a 100)
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed sm:text-sm">
                Gere dezenas de CPFs únicos de uma só vez e exporte em TXT, CSV ou JSON para
                popular bancos de dados de homologação e testes automatizados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0 sm:space-y-5">
              {/* Bulk Controls */}
              <div className="grid gap-4 rounded-xl border bg-muted/20 p-4 sm:gap-5 sm:p-5 lg:grid-cols-3">
                {/* Quantity Input + Quick Pills */}
                <div className="space-y-2">
                  <Label htmlFor="bulk-qty-input" className="text-sm font-semibold">
                    Quantidade (1 a 100)
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
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
                      className="h-10 w-20 font-mono text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {BULK_PRESETS.map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          variant={bulkQuantity === preset ? "default" : "outline"}
                          size="sm"
                          className="h-10 px-2.5 text-xs font-medium"
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
                  <Label htmlFor="bulk-state-select" className="text-sm font-semibold">
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
                    <SelectTrigger id="bulk-state-select" className="h-10 w-full text-sm">
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
                <div className="flex flex-col justify-between gap-2.5">
                  <div className="flex h-10 items-center justify-between rounded-lg border bg-background px-3.5">
                    <Label htmlFor="bulk-format-switch" className="text-xs sm:text-sm font-semibold">
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
                    className="h-10 w-full gap-2 px-4 text-sm font-medium"
                  >
                    <RefreshCw className="size-4" />
                    <span>Gerar {bulkQuantity} CPFs</span>
                  </Button>
                </div>
              </div>

              {/* Bulk Toolbar & List */}
              <div className="space-y-3.5">
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {displayedBulkList.length} CPFs gerados
                    {bulkState !== "ALL"
                      ? ` para ${bulkState} (9º dígito ${STATE_TO_DIGIT[bulkState]})`
                      : ""}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() =>
                        handleCopyText(
                          displayedBulkList.join("\n"),
                          `${displayedBulkList.length} CPFs`
                        )
                      }
                      className="h-10 gap-2 px-3.5 text-xs font-medium sm:text-sm"
                    >
                      <Copy className="size-4" />
                      <span>Copiar Todos</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleExportTxt}
                      className="h-10 gap-2 px-3.5 text-xs font-medium sm:text-sm"
                    >
                      <FileText className="size-4" />
                      <span>Baixar .TXT</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleExportCsv}
                      className="h-10 gap-2 px-3.5 text-xs font-medium sm:text-sm"
                    >
                      <FileSpreadsheet className="size-4" />
                      <span>Baixar .CSV</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={handleExportJson}
                      className="h-10 gap-2 px-3.5 text-xs font-medium sm:text-sm"
                    >
                      <FileJson className="size-4" />
                      <span>Baixar .JSON</span>
                    </Button>
                  </div>
                </div>

                <div className="grid max-h-80 grid-cols-1 gap-2.5 overflow-y-auto rounded-xl border bg-muted/20 p-3.5 sm:grid-cols-2 sm:p-4 md:grid-cols-3 xl:grid-cols-4">
                  {displayedBulkList.map((cpfItem, idx) => (
                    <div
                      key={`${cpfItem}-${idx}`}
                      className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3.5 py-2.5 font-mono text-sm shadow-2xs transition-colors hover:border-primary/40"
                    >
                      <span className="w-7 font-mono text-xs text-muted-foreground">
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
      <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
        <Card className="gap-4 p-4 sm:gap-5 sm:p-5 lg:col-span-5">
          <CardHeader className="gap-1.5 p-0">
            <CardTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
              <Info className="size-4 text-primary" />
              <span>Como funciona o cálculo do CPF?</span>
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed sm:text-sm">
              Entenda a estrutura dos dígitos verificadores adotada pela Receita Federal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 p-0 text-xs leading-relaxed text-muted-foreground sm:text-sm">
            <p className="leading-relaxed">
              O Cadastro de Pessoas Físicas (CPF) é formado por{" "}
              <strong className="text-foreground">11 dígitos decimais</strong> no formato{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                d₁d₂d₃.d₄d₅d₆.d₇d₈d₉-dv₁dv₂
              </code>
              .
            </p>
            <div className="space-y-1.5 rounded-xl border bg-muted/30 p-3.5 text-xs leading-relaxed sm:p-4 sm:text-sm">
              <p className="font-semibold text-foreground">
                1. Cálculo do 1º Dígito Verificador (dv₁):
              </p>
              <p className="leading-relaxed">
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
            <div className="space-y-1.5 rounded-xl border bg-muted/30 p-3.5 text-xs leading-relaxed sm:p-4 sm:text-sm">
              <p className="font-semibold text-foreground">
                2. Cálculo do 2º Dígito Verificador (dv₂):
              </p>
              <p className="leading-relaxed">
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
            <p className="text-xs leading-relaxed">
              <strong className="text-foreground">Nota Importante:</strong> Os CPFs gerados por
              esta ferramenta são números fictícios destinados exclusivamente a testes de
              desenvolvimento de software, QA e homologação.
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4 p-4 sm:gap-5 sm:p-5 lg:col-span-7">
          <CardHeader className="gap-1.5 p-0">
            <CardTitle className="flex items-center gap-2 text-base font-bold sm:text-lg">
              <MapPin className="size-4 text-primary" />
              <span>Tabela Oficial do 9º Dígito — Regiões Fiscais (UF)</span>
            </CardTitle>
            <CardDescription className="text-xs leading-relaxed sm:text-sm">
              O nono algarismo do CPF identifica a Região Fiscal de emissão. Clique em qualquer UF
              para gerar um CPF daquele estado.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => {
                const region = FISCAL_REGIONS[digit];
                return (
                  <div
                    key={digit}
                    className="flex flex-col justify-between gap-3 rounded-xl border bg-muted/20 p-3.5 transition-colors hover:border-primary/30 sm:p-4"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-foreground">
                          {region.name}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {region.description}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="shrink-0 px-2 py-0.5 font-mono text-xs font-bold text-primary"
                      >
                        9º Dígito: {digit}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
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

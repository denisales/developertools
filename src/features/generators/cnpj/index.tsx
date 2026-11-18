"use client";

import * as React from "react";
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCode2,
  FileSpreadsheet,
  FileText,
  Info,
  Layers,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
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
  cleanCnpj,
  formatCnpj,
  generateCnpj,
  generateCnpjBatch,
  unformatCnpj,
  validateCnpj,
  type CnpjBranchPreset,
  type CnpjFormatMode,
} from "./cnpj-utils";

export * from "./cnpj-utils";

const BATCH_PRESETS = [5, 10, 25, 50, 100] as const;

const VALIDATOR_EXAMPLES = [
  {
    label: "Numérico Válido",
    value: "11.222.333/0001-81",
    badge: "Clássico",
  },
  {
    label: "Alfanumérico Válido",
    value: "12.ABC.345/01DE-35",
    badge: "Novo Padrão",
  },
  {
    label: "DV Inválido",
    value: "11.222.333/0001-99",
    badge: "Teste de Erro",
  },
] as const;

function resolveBranchString(
  preset: CnpjBranchPreset,
  customBranch: string
): string {
  if (preset === "headquarters") return "0001";
  if (preset === "random_branch") {
    const randomNum = Math.floor(Math.random() * 98) + 2; // 0002..0099
    return String(randomNum).padStart(4, "0");
  }
  return customBranch.trim() || "0002";
}

export function CnpjGeneratorFeature() {
  const [activeTab, setActiveTab] = React.useState<string>("generator");

  // Shared / Single Generator state
  const [mode, setMode] = React.useState<CnpjFormatMode>("numeric");
  const [formatted, setFormatted] = React.useState<boolean>(true);
  const [branchPreset, setBranchPreset] =
    React.useState<CnpjBranchPreset>("headquarters");
  const [customBranch, setCustomBranch] = React.useState<string>("0002");

  // Current generated CNPJ (stored as 14 clean chars so toggling punctuation is instant)
  const [currentCleanCnpj, setCurrentCleanCnpj] = React.useState<string>(
    "11222333000181"
  );
  const [history, setHistory] = React.useState<string[]>(["11222333000181"]);
  const [copiedSingle, setCopiedSingle] = React.useState<boolean>(false);

  // Validator state
  const [validatorInput, setValidatorInput] = React.useState<string>(
    "12.ABC.345/01DE-35"
  );

  // Batch generator state
  const [batchCount, setBatchCount] = React.useState<number>(10);
  const [batchRawList, setBatchRawList] = React.useState<string[]>([
    "11222333000181",
    "12ABC34501DE35",
    "45997418000153",
    "33000167000101",
    "60701190000104",
    "00000000000191",
    "07526557000100",
    "02558157000162",
    "47960950000121",
    "18727053000174",
  ]);

  const displayedSingleCnpj = React.useMemo(() => {
    return formatted ? formatCnpj(currentCleanCnpj) : currentCleanCnpj;
  }, [currentCleanCnpj, formatted]);

  const singleParts = React.useMemo(() => {
    const cleaned = cleanCnpj(currentCleanCnpj);
    return {
      root: cleaned.slice(0, 8),
      branch: cleaned.slice(8, 12),
      dv: cleaned.slice(12, 14),
    };
  }, [currentCleanCnpj]);

  const handleGenerateSingle = React.useCallback(
    (overrideMode?: CnpjFormatMode, overridePreset?: CnpjBranchPreset) => {
      const targetMode = overrideMode ?? mode;
      const targetPreset = overridePreset ?? branchPreset;
      const branch = resolveBranchString(targetPreset, customBranch);
      const nextClean = generateCnpj({
        formatted: false,
        mode: targetMode,
        branch,
      });
      setCurrentCleanCnpj(nextClean);
      setHistory((prev) => [
        nextClean,
        ...prev.filter((item) => item !== nextClean).slice(0, 7),
      ]);
      setCopiedSingle(false);
    },
    [mode, branchPreset, customBranch]
  );

  const handleCopyText = async (text: string, label = "CNPJ") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado para a área de transferência!`, {
        description: text,
      });
      return true;
    } catch {
      toast.error("Não foi possível copiar automaticamente.");
      return false;
    }
  };

  const handleCopySingle = async () => {
    const ok = await handleCopyText(displayedSingleCnpj, "CNPJ");
    if (ok) {
      setCopiedSingle(true);
      setTimeout(() => setCopiedSingle(false), 2000);
    }
  };

  const handleInspectInValidator = (cnpjValue: string) => {
    setValidatorInput(formatCnpj(cnpjValue));
    setActiveTab("validator");
  };

  // Batch handlers
  const displayedBatchList = React.useMemo(() => {
    return batchRawList.map((item) =>
      formatted ? formatCnpj(item) : unformatCnpj(item)
    );
  }, [batchRawList, formatted]);

  const handleGenerateBatch = React.useCallback(() => {
    const safeQty = Math.max(1, Math.min(100, batchCount || 10));
    if (branchPreset !== "random_branch") {
      const branch = resolveBranchString(branchPreset, customBranch);
      const list = generateCnpjBatch(safeQty, {
        formatted: false,
        mode,
        branch,
      });
      setBatchRawList(list);
      toast.success(`${list.length} CNPJs gerados com sucesso!`);
      return;
    }

    const list: string[] = [];
    const seen = new Set<string>();
    let attempts = 0;
    while (list.length < safeQty && attempts < safeQty * 5) {
      const branch = resolveBranchString(branchPreset, customBranch);
      const generated = generateCnpj({
        formatted: false,
        mode,
        branch,
      });
      if (!seen.has(generated)) {
        seen.add(generated);
        list.push(generated);
      }
      attempts++;
    }
    setBatchRawList(list);
    toast.success(`${list.length} CNPJs gerados com sucesso!`);
  }, [batchCount, branchPreset, customBranch, mode]);

  const handleDownloadBatch = (ext: "txt" | "csv" | "json") => {
    if (displayedBatchList.length === 0) return;

    let content = "";
    let mimeType = "text/plain;charset=utf-8";

    if (ext === "txt") {
      content = displayedBatchList.join("\n");
    } else if (ext === "csv") {
      mimeType = "text/csv;charset=utf-8";
      const rows = displayedBatchList.map((val, idx) => {
        const raw = cleanCnpj(val);
        const tipo = /[A-Z]/.test(raw) ? "Alfanumerico" : "Numerico";
        const ordem = raw.slice(8, 12);
        const estab = ordem === "0001" ? "Matriz" : "Filial";
        return `${idx + 1},"${val}","${raw}","${tipo}","${estab}"`;
      });
      content = [
        "indice,cnpj_formatado,cnpj_limpo,padrao,estabelecimento",
        ...rows,
      ].join("\n");
    } else {
      mimeType = "application/json;charset=utf-8";
      const payload = displayedBatchList.map((val, idx) => {
        const raw = cleanCnpj(val);
        return {
          index: idx + 1,
          cnpj: val,
          cleanCnpj: raw,
          formattedCnpj: formatCnpj(raw),
          mode: /[A-Z]/.test(raw) ? "alphanumeric" : "numeric",
          branch: raw.slice(8, 12),
          isHeadquarters: raw.slice(8, 12) === "0001",
        };
      });
      content = JSON.stringify(payload, null, 2);
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cnpjs-${mode}-${displayedBatchList.length}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Arquivo .${ext.toUpperCase()} baixado com sucesso!`);
  };

  // Validation computation
  const validationResult = React.useMemo(() => {
    if (!validatorInput.trim()) return null;
    return validateCnpj(validatorInput);
  }, [validatorInput]);

  return (
    <div className="w-full space-y-5 pb-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-xs">
            <Building2 className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                Gerador e Validador de CNPJ
              </h1>
              <Badge
                variant="secondary"
                className="gap-1.5 px-2.5 py-0.5 text-xs font-medium"
              >
                <Sparkles className="size-3" />
                Numérico e Alfanumérico
              </Badge>
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Gere e valide CNPJs para testes de software no formato{" "}
              <strong>Numérico</strong> ou <strong>Alfanumérico</strong>, com
              opção de matriz, filial e geração em lote.
            </p>
          </div>
        </div>
      </div>

      {/* Main Feature Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-5"
      >
        <TabsList className="grid h-10 w-full grid-cols-3 gap-1 rounded-lg p-1 sm:w-fit">
          <TabsTrigger
            value="generator"
            className="gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium sm:text-sm"
          >
            <RefreshCw className="size-3.5 shrink-0" />
            <span>Gerador de CNPJ</span>
          </TabsTrigger>
          <TabsTrigger
            value="validator"
            className="gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium sm:text-sm"
          >
            <ShieldCheck className="size-3.5 shrink-0" />
            <span>Validador de CNPJ</span>
          </TabsTrigger>
          <TabsTrigger
            value="batch"
            className="gap-1.5 rounded-md px-3.5 py-1.5 text-xs font-medium sm:text-sm"
          >
            <Layers className="size-3.5 shrink-0" />
            <span>Gerador em Massa</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: GERADOR DE CNPJ */}
        <TabsContent value="generator" className="mt-4 space-y-5">
          <div className="grid gap-4 sm:gap-5 lg:grid-cols-12">
            {/* Options Column */}
            <Card className="flex flex-col justify-between gap-4 p-4 sm:gap-5 sm:p-5 lg:col-span-5">
              <CardHeader className="space-y-1 p-0">
                <CardTitle className="text-base font-bold sm:text-lg">
                  Opções de Geração
                </CardTitle>
                <CardDescription className="text-xs leading-relaxed sm:text-sm">
                  Personalize o formato, pontuação e ordem do estabelecimento.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 p-0">
                {/* Mode selector: Numeric vs Alphanumeric */}
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">
                      Padrão do CNPJ
                    </Label>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Escolha entre o formato numérico tradicional ou o padrão
                      alfanumérico.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant={mode === "numeric" ? "default" : "outline"}
                      className="h-auto flex-col items-start gap-0.5 rounded-lg px-3.5 py-2.5 text-left"
                      onClick={() => {
                        setMode("numeric");
                        handleGenerateSingle("numeric");
                      }}
                    >
                      <span className="text-xs font-semibold sm:text-sm">
                        Numérico
                      </span>
                      <span className="text-xs leading-normal opacity-85">
                        Apenas dígitos 0-9
                      </span>
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "alphanumeric" ? "default" : "outline"}
                      className="h-auto flex-col items-start gap-0.5 rounded-lg px-3.5 py-2.5 text-left"
                      onClick={() => {
                        setMode("alphanumeric");
                        handleGenerateSingle("alphanumeric");
                      }}
                    >
                      <span className="text-xs font-semibold sm:text-sm">
                        Alfanumérico
                      </span>
                      <span className="text-xs leading-normal opacity-85">
                        Letras e números
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Punctuation Toggle */}
                <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="cnpj-punctuation-switch"
                      className="cursor-pointer text-sm font-semibold"
                    >
                      Gerar com pontuação?
                    </Label>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Formato{" "}
                      <code className="font-mono font-medium">
                        XX.XXX.XXX/0001-XX
                      </code>
                    </p>
                  </div>
                  <Switch
                    id="cnpj-punctuation-switch"
                    checked={formatted}
                    onCheckedChange={setFormatted}
                  />
                </div>

                {/* Branch / Establishment selector */}
                <div className="flex flex-col gap-3 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="branch-preset-select"
                      className="text-sm font-semibold"
                    >
                      Tipo de Estabelecimento (Ordem)
                    </Label>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Define os 4 caracteres após a barra (Matriz 0001 ou
                      Filial).
                    </p>
                  </div>
                  <Select
                    value={branchPreset}
                    onValueChange={(val) => {
                      const nextPreset = val as CnpjBranchPreset;
                      setBranchPreset(nextPreset);
                      handleGenerateSingle(mode, nextPreset);
                    }}
                  >
                    <SelectTrigger
                      id="branch-preset-select"
                      className="h-10 bg-background px-4 text-sm"
                    >
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="headquarters">
                        Matriz (0001 — Padrão)
                      </SelectItem>
                      <SelectItem value="random_branch">
                        Filial Aleatória (0002 a 0099)
                      </SelectItem>
                      <SelectItem value="custom">
                        Ordem / Filial Específica
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {branchPreset === "custom" && (
                    <div className="space-y-2 pt-1">
                      <Label
                        htmlFor="custom-branch-input"
                        className="text-xs font-medium"
                      >
                        Código da Ordem (4 posições)
                      </Label>
                      <div className="flex gap-2.5">
                        <Input
                          id="custom-branch-input"
                          maxLength={4}
                          value={customBranch}
                          onChange={(e) => {
                            const raw = e.target.value
                              .toUpperCase()
                              .replace(
                                mode === "numeric" ? /[^0-9]/g : /[^0-9A-Z]/g,
                                ""
                              )
                              .slice(0, 4);
                            setCustomBranch(raw);
                          }}
                          placeholder={mode === "numeric" ? "0002" : "01DE"}
                          className="h-10 bg-background px-4 font-mono text-sm uppercase"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-10 px-4 text-sm font-medium"
                          onClick={() => handleGenerateSingle()}
                        >
                          Aplicar
                        </Button>
                      </div>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {mode === "numeric"
                          ? "Digite de 0001 (Matriz) até 9999."
                          : "Aceita números e letras maiúsculas (ex: 0002 ou 01DE)."}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter className="border-t p-0 pt-4">
                <Button
                  type="button"
                  className="h-10 w-full gap-2 px-4 text-sm font-medium"
                  onClick={() => handleGenerateSingle()}
                >
                  <RefreshCw className="size-4" />
                  Gerar Novo CNPJ
                </Button>
              </CardFooter>
            </Card>

            {/* Result & Anatomy Column */}
            <Card className="flex flex-col justify-between gap-4 p-4 sm:gap-5 sm:p-5 lg:col-span-7">
              <CardHeader className="p-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-bold sm:text-lg">
                      CNPJ Gerado
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed sm:text-sm">
                      Pronto para uso em cadastros, homologação e testes de
                      sistemas.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={mode === "alphanumeric" ? "default" : "secondary"}
                      className="px-2.5 py-0.5 text-xs font-medium"
                    >
                      {mode === "alphanumeric"
                        ? "Padrão Alfanumérico"
                        : "Numérico Clássico"}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="px-2.5 py-0.5 text-xs font-medium"
                    >
                      {singleParts.branch === "0001"
                        ? "Matriz (0001)"
                        : `Filial (${singleParts.branch})`}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 p-0">
                {/* Hero CNPJ Output Box */}
                <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-primary/20 bg-muted/40 p-4 text-center shadow-inner sm:p-5">
                  <span className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Clique para copiar ou gere um novo
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySingle}
                    title="Clique para copiar o CNPJ"
                    className="cursor-pointer font-mono text-2xl font-bold tracking-wider text-foreground transition-colors hover:text-primary sm:text-3xl"
                  >
                    {displayedSingleCnpj}
                  </button>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                    <Button
                      type="button"
                      onClick={handleCopySingle}
                      className="h-10 min-w-36 gap-2 px-4 text-sm font-medium"
                    >
                      {copiedSingle ? (
                        <>
                          <Check className="size-4" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="size-4" />
                          Copiar CNPJ
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleGenerateSingle()}
                      className="h-10 gap-2 px-4 text-sm font-medium"
                    >
                      <RefreshCw className="size-4" />
                      Gerar Outro
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        handleInspectInValidator(currentCleanCnpj)
                      }
                      className="h-10 gap-2 px-4 text-sm font-medium"
                    >
                      <ShieldCheck className="size-4" />
                      Validar CNPJ
                    </Button>
                  </div>
                </div>

                {/* Structural Anatomy Breakdown */}
                <div className="grid grid-cols-1 gap-3 text-center sm:grid-cols-3">
                  <div className="space-y-1 rounded-xl border bg-background p-3.5 sm:p-4">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Raiz (8 pos.)
                    </p>
                    <p className="font-mono text-base font-bold sm:text-lg">
                      {singleParts.root}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Inscrição Base
                    </p>
                  </div>
                  <div className="space-y-1 rounded-xl border bg-background p-3.5 sm:p-4">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Ordem (4 pos.)
                    </p>
                    <p className="font-mono text-base font-bold sm:text-lg">
                      {singleParts.branch}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {singleParts.branch === "0001" ? "Matriz" : "Filial"}
                    </p>
                  </div>
                  <div className="space-y-1 rounded-xl border bg-primary/5 p-3.5 sm:p-4">
                    <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                      DVs (2 pos.)
                    </p>
                    <p className="font-mono text-base font-bold text-primary sm:text-lg">
                      {singleParts.dv}
                    </p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Dígitos Verificadores
                    </p>
                  </div>
                </div>

                {/* Recent Session History */}
                {history.length > 1 && (
                  <div className="space-y-2.5 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Últimos CNPJs gerados nesta sessão
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2.5 text-xs font-medium text-muted-foreground"
                        onClick={() => setHistory([currentCleanCnpj])}
                      >
                        Limpar histórico
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {history.slice(1).map((item) => {
                        const text = formatted ? formatCnpj(item) : item;
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => handleCopyText(text, "CNPJ")}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border bg-background px-3 py-1.5 font-mono text-xs font-medium transition-colors hover:border-primary/40 hover:bg-muted"
                          >
                            <span>{text}</span>
                            <Copy className="size-3 opacity-60" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t p-0 pt-4 text-xs leading-relaxed text-muted-foreground">
                <Info className="mr-2 size-4 shrink-0 text-primary" />
                Os números são gerados exclusivamente para testes de software e
                homologação (sem vínculo com empresas reais).
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: VALIDADOR DE CNPJ */}
        <TabsContent value="validator" className="mt-4 space-y-5">
          <Card className="gap-4 p-4 sm:gap-5 sm:p-5">
            <CardHeader className="space-y-1 p-0">
              <CardTitle className="text-base font-bold sm:text-lg">
                Validador de CNPJ (Numérico e Alfanumérico)
              </CardTitle>
              <CardDescription className="text-xs leading-relaxed sm:text-sm">
                Digite ou cole qualquer CNPJ com ou sem máscara para verificar
                sua validade e conferir os dígitos verificadores.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 p-0">
              <div className="space-y-3">
                <Label
                  htmlFor="cnpj-validator-input"
                  className="text-sm font-semibold"
                >
                  CNPJ para validação
                </Label>
                <div className="flex flex-col gap-2.5 sm:flex-row">
                  <Input
                    id="cnpj-validator-input"
                    maxLength={18}
                    value={validatorInput}
                    onChange={(e) => {
                      const raw = cleanCnpj(e.target.value).slice(0, 14);
                      setValidatorInput(formatCnpj(raw));
                    }}
                    placeholder="Ex: 11.222.333/0001-81 ou 12.ABC.345/01DE-35"
                    className="h-10 px-4 font-mono text-sm uppercase sm:text-base"
                  />
                  <div className="flex gap-2.5">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 gap-2 px-4 text-sm font-medium"
                      onClick={() => setValidatorInput("")}
                    >
                      <Trash2 className="size-4" />
                      Limpar
                    </Button>
                  </div>
                </div>

                {/* Quick Example Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-0.5">
                  <span className="text-xs font-medium text-muted-foreground">
                    Exemplos rápidos:
                  </span>
                  {VALIDATOR_EXAMPLES.map((ex) => (
                    <button
                      key={ex.value}
                      type="button"
                      onClick={() => setValidatorInput(ex.value)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 text-xs transition-colors hover:border-primary/40 hover:bg-muted"
                    >
                      <span className="font-medium">{ex.label}:</span>
                      <code className="font-mono font-semibold">
                        {ex.value}
                      </code>
                    </button>
                  ))}
                </div>
              </div>

              {/* Validation Result Banner */}
              {validationResult && (
                <div className="space-y-5">
                  <div
                    className={`rounded-xl border-2 p-4 sm:p-5 ${
                      validationResult.isValid
                        ? "border-emerald-500/30 bg-emerald-500/5"
                        : "border-destructive/30 bg-destructive/5"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-3">
                        {validationResult.isValid ? (
                          <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <ShieldAlert className="mt-0.5 size-6 shrink-0 text-destructive" />
                        )}
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold">
                              {validationResult.isValid
                                ? "CNPJ Válido!"
                                : "CNPJ Inválido"}
                            </h3>
                            <Badge
                              variant={
                                validationResult.isValid
                                  ? "default"
                                  : "destructive"
                              }
                              className="px-2.5 py-0.5 font-mono text-xs font-medium"
                            >
                              {validationResult.formattedCnpj ||
                                validationResult.cleanCnpj}
                            </Badge>
                            {validationResult.cleanCnpj.length === 14 && (
                              <Badge
                                variant="outline"
                                className="px-2.5 py-0.5 text-xs font-medium"
                              >
                                {validationResult.mode === "alphanumeric"
                                  ? "Padrão Alfanumérico"
                                  : "Numérico Clássico"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                            {validationResult.isValid
                              ? `Os dígitos verificadores (${validationResult.providedCheckDigits}) estão corretos.`
                              : validationResult.reasonMessage}
                          </p>
                        </div>
                      </div>

                      {validationResult.cleanCnpj.length === 14 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            handleCopyText(
                              validationResult.formattedCnpj,
                              "CNPJ validado"
                            )
                          }
                          className="h-10 shrink-0 gap-2 px-4 text-sm font-medium"
                        >
                          <Copy className="size-4" />
                          Copiar Formatado
                        </Button>
                      )}
                    </div>

                    {/* Diagnostic Metadata Grid */}
                    {validationResult.cleanCnpj.length === 14 && (
                      <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4 sm:grid-cols-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            Raiz (Inscrição)
                          </span>
                          <p className="font-mono text-sm font-bold sm:text-base">
                            {validationResult.rootCode}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            Estabelecimento
                          </span>
                          <p className="font-mono text-sm font-bold sm:text-base">
                            {validationResult.branchCode} (
                            {validationResult.isHeadquarters
                              ? "Matriz"
                              : "Filial"}
                            )
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            DVs Informados
                          </span>
                          <p className="font-mono text-sm font-bold sm:text-base">
                            {validationResult.providedCheckDigits}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-xs font-medium text-muted-foreground">
                            DVs Esperados
                          </span>
                          <p className="font-mono text-sm font-bold text-primary sm:text-base">
                            {validationResult.expectedCheckDigits || "—"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step-by-Step DV1 and DV2 Breakdown Tables */}
                  {validationResult.steps && (
                    <div className="space-y-4">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold tracking-tight sm:text-base">
                          Detalhamento dos Dígitos Verificadores
                        </h4>
                        <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                          Confira os pesos aplicados a cada posição do CNPJ.
                        </p>
                      </div>
                      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
                        {/* 1st Check Digit Table */}
                        <Card className="gap-4 p-3.5 sm:p-4">
                          <CardHeader className="space-y-1 p-0">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-sm font-bold sm:text-base">
                                1º Dígito Verificador (DV1)
                              </CardTitle>
                              <Badge
                                variant="secondary"
                                className="px-2.5 py-0.5 font-mono text-xs font-semibold"
                              >
                                DV1 = {validationResult.steps.expectedDv1}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs leading-relaxed">
                              Soma dos produtos = {validationResult.steps.sum1} | Resto da divisão ={" "}
                              {validationResult.steps.remainder1}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="h-9 px-2.5 text-xs font-semibold">
                                    Pos
                                  </TableHead>
                                  <TableHead className="h-9 px-2.5 text-xs font-semibold">
                                    Caractere
                                  </TableHead>
                                  <TableHead className="h-9 px-2.5 text-xs font-semibold">
                                    Valor Base
                                  </TableHead>
                                  <TableHead className="h-9 px-2.5 text-xs font-semibold">
                                    Peso
                                  </TableHead>
                                  <TableHead className="h-9 px-2.5 text-right text-xs font-semibold">
                                    Produto
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {validationResult.steps.dv1Steps.map((step) => (
                                  <TableRow key={`dv1-${step.position}`}>
                                    <TableCell className="px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                                      {step.position}ª
                                    </TableCell>
                                    <TableCell className="px-2.5 py-1.5 font-mono text-xs font-bold">
                                      {step.char}
                                    </TableCell>
                                    <TableCell className="px-2.5 py-1.5 font-mono text-xs">
                                      {step.calcValue}
                                    </TableCell>
                                    <TableCell className="px-2.5 py-1.5 font-mono text-xs">
                                      × {step.weight}
                                    </TableCell>
                                    <TableCell className="px-2.5 py-1.5 text-right font-mono text-xs font-semibold">
                                      {step.product}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        {/* 2nd Check Digit Table */}
                        <Card className="gap-4 p-3.5 sm:p-4">
                          <CardHeader className="space-y-1 p-0">
                            <div className="flex items-center justify-between gap-2">
                              <CardTitle className="text-sm font-bold sm:text-base">
                                2º Dígito Verificador (DV2)
                              </CardTitle>
                              <Badge
                                variant="secondary"
                                className="px-2.5 py-0.5 font-mono text-xs font-semibold"
                              >
                                DV2 = {validationResult.steps.expectedDv2}
                              </Badge>
                            </div>
                            <CardDescription className="text-xs leading-relaxed">
                              Soma dos produtos = {validationResult.steps.sum2} | Resto da divisão ={" "}
                              {validationResult.steps.remainder2}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-0">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="h-9 px-2.5 text-xs font-semibold">
                                    Pos
                                  </TableHead>
                                  <TableHead className="h-9 px-2.5 text-xs font-semibold">
                                    Caractere
                                  </TableHead>
                                  <TableHead className="h-9 px-2.5 text-xs font-semibold">
                                    Valor Base
                                  </TableHead>
                                  <TableHead className="h-9 px-2.5 text-xs font-semibold">
                                    Peso
                                  </TableHead>
                                  <TableHead className="h-9 px-2.5 text-right text-xs font-semibold">
                                    Produto
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {validationResult.steps.dv2Steps.map((step) => (
                                  <TableRow key={`dv2-${step.position}`}>
                                    <TableCell className="px-2.5 py-1.5 font-mono text-xs text-muted-foreground">
                                      {step.position}ª
                                    </TableCell>
                                    <TableCell className="px-2.5 py-1.5 font-mono text-xs font-bold">
                                      {step.char}
                                    </TableCell>
                                    <TableCell className="px-2.5 py-1.5 font-mono text-xs">
                                      {step.calcValue}
                                    </TableCell>
                                    <TableCell className="px-2.5 py-1.5 font-mono text-xs">
                                      × {step.weight}
                                    </TableCell>
                                    <TableCell className="px-2.5 py-1.5 text-right font-mono text-xs font-semibold">
                                      {step.product}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: GERADOR EM MASSA */}
        <TabsContent value="batch" className="mt-4 space-y-5">
          <Card className="gap-4 p-4 sm:gap-5 sm:p-5">
            <CardHeader className="p-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold sm:text-lg">
                    Gerador de CNPJ em Massa (Lote)
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed sm:text-sm">
                    Gere até 100 CNPJs simultaneamente para popular bancos de
                    dados, testes automatizados e planilhas.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      handleCopyText(
                        displayedBatchList.join("\n"),
                        `${displayedBatchList.length} CNPJs`
                      )
                    }
                    className="h-10 gap-2 px-4 text-sm font-medium"
                  >
                    <Copy className="size-4" />
                    Copiar Todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDownloadBatch("txt")}
                    className="h-10 gap-2 px-4 text-sm font-medium"
                  >
                    <FileText className="size-4" />
                    .TXT
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDownloadBatch("csv")}
                    className="h-10 gap-2 px-4 text-sm font-medium"
                  >
                    <FileSpreadsheet className="size-4" />
                    .CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleDownloadBatch("json")}
                    className="h-10 gap-2 px-4 text-sm font-medium"
                  >
                    <FileCode2 className="size-4" />
                    .JSON
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-5 p-0">
              {/* Batch Controls Bar */}
              <div className="grid gap-4 rounded-xl border bg-muted/20 p-3.5 sm:gap-5 sm:p-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="batch-count-input"
                    className="text-xs font-semibold sm:text-sm"
                  >
                    Quantidade (1 a 100)
                  </Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      id="batch-count-input"
                      type="number"
                      min={1}
                      max={100}
                      value={batchCount}
                      onChange={(e) =>
                        setBatchCount(
                          Math.max(
                            1,
                            Math.min(100, Number(e.target.value) || 1)
                          )
                        )
                      }
                      className="h-10 w-20 bg-background px-3 font-mono text-sm"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {BATCH_PRESETS.map((preset) => (
                        <Button
                          key={preset}
                          type="button"
                          size="sm"
                          variant={
                            batchCount === preset ? "default" : "outline"
                          }
                          className="h-8 px-2.5 text-xs font-medium"
                          onClick={() => setBatchCount(preset)}
                        >
                          {preset}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold sm:text-sm">
                    Padrão
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={mode === "numeric" ? "default" : "outline"}
                      className="h-10 px-4 text-sm font-medium"
                      onClick={() => setMode("numeric")}
                    >
                      Numérico
                    </Button>
                    <Button
                      type="button"
                      variant={mode === "alphanumeric" ? "default" : "outline"}
                      className="h-10 px-4 text-sm font-medium"
                      onClick={() => setMode("alphanumeric")}
                    >
                      Alfanumérico
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold sm:text-sm">
                    Pontuação
                  </Label>
                  <div className="flex h-10 items-center justify-between rounded-lg border bg-background px-4">
                    <span className="text-xs font-medium sm:text-sm">
                      {formatted ? "Com máscara" : "Apenas caracteres"}
                    </span>
                    <Switch
                      checked={formatted}
                      onCheckedChange={setFormatted}
                    />
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    className="h-10 w-full gap-2 px-4 text-sm font-medium"
                    onClick={handleGenerateBatch}
                  >
                    <RefreshCw className="size-4" />
                    Gerar {batchCount} CNPJs
                  </Button>
                </div>
              </div>

              {/* Batch Output Grid */}
              <div className="max-h-[26rem] overflow-y-auto rounded-xl border bg-background p-3.5 sm:p-4">
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {displayedBatchList.map((item, idx) => (
                    <div
                      key={`${item}-${idx}`}
                      className="group flex items-center justify-between rounded-lg border bg-muted/20 py-2 px-3.5 font-mono text-sm transition-colors hover:border-primary/40 hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 font-mono text-xs font-medium text-muted-foreground">
                          #{idx + 1}
                        </span>
                        <span className="font-mono text-xs font-semibold sm:text-sm">
                          {item}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          title="Copiar CNPJ"
                          onClick={() =>
                            handleCopyText(item, `CNPJ #${idx + 1}`)
                          }
                        >
                          <Copy className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-wrap items-center justify-between gap-2 border-t p-0 pt-4 text-xs leading-relaxed text-muted-foreground">
              <span>
                Total exibido: <strong>{displayedBatchList.length}</strong>{" "}
                CNPJs ({mode === "alphanumeric" ? "Alfanumérico" : "Numérico"})
              </span>
              <div className="flex items-center gap-1.5">
                <Download className="size-3.5 text-primary" />
                <span>
                  Exporte em TXT, CSV ou JSON para importar nos seus testes.
                </span>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Educational Section */}
      <Card className="gap-4 p-4 sm:gap-5 sm:p-5">
        <CardHeader className="space-y-1 p-0">
          <CardTitle className="text-base font-bold sm:text-lg">
            Como funciona a estrutura do CNPJ Numérico e Alfanumérico?
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed sm:text-sm">
            Entenda a composição das 14 posições e o cálculo dos dígitos
            verificadores.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 text-sm leading-relaxed text-muted-foreground">
          <div className="grid gap-4 sm:gap-5 md:grid-cols-3">
            <div className="space-y-1.5 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
              <h4 className="text-sm font-semibold text-foreground">
                1. Raiz e Ordem (12 posições)
              </h4>
              <p className="text-xs leading-relaxed sm:text-sm">
                As 8 primeiras posições formam a raiz da empresa e as 4
                seguintes identificam o estabelecimento (ex:{" "}
                <code className="font-mono">0001</code> para matriz). No padrão
                alfanumérico, essas 12 posições aceitam números (
                <code className="font-mono">0-9</code>) e letras (
                <code className="font-mono">A-Z</code>).
              </p>
            </div>
            <div className="space-y-1.5 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
              <h4 className="text-sm font-semibold text-foreground">
                2. Pesos do 1º Dígito (DV1)
              </h4>
              <p className="text-xs leading-relaxed sm:text-sm">
                Multiplicam-se as 12 posições pelos pesos{" "}
                <code className="font-mono">
                  [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
                </code>
                . Calcula-se o resto da soma dividida por <strong>11</strong>:
                se o resto for menor que 2,{" "}
                <code className="font-mono">DV1 = 0</code>; caso contrário,{" "}
                <code className="font-mono">DV1 = 11 - resto</code>.
              </p>
            </div>
            <div className="space-y-1.5 rounded-xl border bg-muted/20 p-3.5 sm:p-4">
              <h4 className="text-sm font-semibold text-foreground">
                3. Pesos do 2º Dígito (DV2)
              </h4>
              <p className="text-xs leading-relaxed sm:text-sm">
                Inclui-se o <code className="font-mono">DV1</code> na 13ª
                posição e aplicam-se os pesos{" "}
                <code className="font-mono">
                  [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
                </code>
                . Divide-se a soma por <strong>11</strong>: se o resto for menor
                que 2, <code className="font-mono">DV2 = 0</code>; senão,{" "}
                <code className="font-mono">DV2 = 11 - resto</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CnpjGeneratorFeature;

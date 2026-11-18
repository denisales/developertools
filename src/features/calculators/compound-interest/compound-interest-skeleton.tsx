import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PRESET_PILL_KEYS = [
  "selic",
  "cdi",
  "ipca",
  "monthly",
  "poupanca",
] as const;

const INPUT_FIELD_KEYS = ["initial", "monthly", "rate", "period"] as const;
const SUMMARY_CARD_KEYS = ["final", "invested", "interest"] as const;

/**
 * Shimmer skeleton placeholder for the BCB reference rate preset bar and status line.
 */
export function BcbPresetsSkeleton() {
  return (
    <div
      data-testid="bcb-presets-skeleton"
      className="space-y-2.5"
      role="status"
      aria-live="polite"
      aria-label="Carregando taxas de referência do Banco Central"
    >
      <div
        id="presets-bar"
        className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar"
      >
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground shrink-0 pr-1">
          <Sparkles className="size-3.5 text-amber-500" />
          Taxas:
        </span>
        {PRESET_PILL_KEYS.map((key) => (
          <Skeleton
            key={key}
            className="h-8 w-24 shrink-0 rounded-lg"
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-lg bg-muted/40 px-3 py-2">
        <Skeleton className="h-4 w-64 max-w-full rounded" />
        <Skeleton className="h-8 w-24 shrink-0 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Full-page Suspense fallback skeleton matching desktop & mobile layout dimensions
 * of CompoundInterestFeature to eliminate layout shift during SSR streaming.
 */
export function CompoundInterestSkeleton() {
  return (
    <div
      data-testid="compound-interest-skeleton"
      className="w-full space-y-4 sm:space-y-5 pb-8"
      role="status"
      aria-live="polite"
      aria-label="Carregando calculadora de juros compostos"
    >
      {/* Cabeçalho Canônico */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <Skeleton className="size-9 sm:size-10 shrink-0 rounded-xl" />
            <Skeleton className="h-6 sm:h-8 w-40 sm:w-80 rounded-md" />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Skeleton className="h-8 sm:h-9 w-16 sm:w-20 rounded-md" />
            <Skeleton className="h-8 sm:h-9 w-18 sm:w-28 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-4 sm:h-5 w-72 sm:w-[460px] max-w-full rounded" />
      </div>

      {/* Card Principal */}
      <Card className="border-border/80 gap-0 p-4 sm:p-5 shadow-xs">
        <CardContent className="p-0 space-y-4">
          <BcbPresetsSkeleton />

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INPUT_FIELD_KEYS.map((key) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    {key !== "period" && <Skeleton className="h-7 w-32 rounded-md" />}
                  </div>
                  <Skeleton className="h-10 w-full rounded-md" />
                  {key === "period" && (
                    <div className="grid grid-cols-5 gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                      {[1, 2, 3, 4, 5].map((chip) => (
                        <Skeleton
                          key={chip}
                          className="h-8 w-full sm:w-11 rounded-lg"
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <Skeleton className="h-10 w-24 rounded-md" />
              <Skeleton className="h-10 w-48 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Barra de Controles de Visão e IR */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-muted/40 p-2 sm:p-2.5">
        <Skeleton className="h-10 w-40 sm:w-56 rounded-lg" />
        <Skeleton className="h-10 w-40 sm:w-56 rounded-lg" />
      </div>

      {/* 3 Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SUMMARY_CARD_KEYS.map((key) => (
          <Card key={key} className="gap-2 p-4 sm:p-5 shadow-xs">
            <CardHeader className="p-0 pb-1">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-28 rounded" />
                <Skeleton className="size-7 shrink-0 rounded-md" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1.5 p-0">
              <Skeleton className="h-7 sm:h-8 w-36 rounded-md" />
              <Skeleton className="h-4 w-40 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

import * as React from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/site-header";
import { SidebarNav } from "@/components/layout/sidebar-nav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />

      <div className="mx-auto flex w-full max-w-[1440px] flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-72 shrink-0 border-r border-border/80 bg-card/40 lg:block">
          <div className="sticky top-[4.25rem] max-h-[calc(100dvh-4.25rem)] overflow-y-auto">
            <SidebarNav />
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-muted/25 py-8 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-8">
          <p className="text-center sm:text-left">
            <strong className="font-semibold text-foreground">DevToolsBR</strong>{" "}
            — Utilitários inspirados no 4Devs e Calculadoras Financeiras. Uso
            exclusivo para testes de software e educação financeira.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 font-medium">
            <Link
              href="/gerador-de-cpf"
              className="transition-colors hover:text-foreground"
            >
              Gerador de CPF
            </Link>
            <Link
              href="/gerador-de-cnpj"
              className="transition-colors hover:text-foreground"
            >
              Gerador de CNPJ
            </Link>
            <Link
              href="/calculadora-juros-compostos"
              className="transition-colors hover:text-foreground"
            >
              Juros Compostos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

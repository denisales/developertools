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

      <div className="flex w-full flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-border/80 bg-card/40 lg:block">
          <div className="sticky top-14 max-h-[calc(100dvh-3.5rem)] overflow-y-auto">
            <SidebarNav />
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 flex-1 px-3 py-3 sm:px-6 sm:py-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-muted/25 py-5 text-xs sm:text-sm text-muted-foreground">
        <div className="mx-auto flex w-full max-w-[1680px] flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center sm:text-left">
            <strong className="font-semibold text-foreground">DevToolsBR</strong>{" "}
            — Geradores de documentos, validadores e calculadoras financeiras. Uso
            exclusivo para testes de software e educação financeira.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-5 font-medium">
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

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

      <div className="mx-auto flex w-full max-w-7xl flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r bg-card/40 lg:block">
          <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto">
            <SidebarNav />
          </div>
        </aside>

        {/* Main Workspace */}
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-6 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <p>
            <strong>DevToolsBR</strong> — Utilitários inspirados no 4Devs e
            Calculadoras Financeiras. Uso exclusivo para testes de software e
            educação financeira.
          </p>
          <div className="flex items-center gap-4">
            <Link href="/gerador-de-cpf" className="hover:text-foreground">
              Gerador de CPF
            </Link>
            <Link href="/gerador-de-cnpj" className="hover:text-foreground">
              Gerador de CNPJ
            </Link>
            <Link
              href="/calculadora-juros-compostos"
              className="hover:text-foreground"
            >
              Juros Compostos
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "DevToolsBR — Geradores, Validadores (4Devs) & Calculadoras",
    template: "%s | DevToolsBR",
  },
  description:
    "Plataforma moderna e responsiva de ferramentas para desenvolvedores e investidores: Gerador de CPF, Gerador de CNPJ, Calculadora de Juros Compostos e catálogo 4Devs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-dvh font-sans antialiased">
        <AppShell>{children}</AppShell>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}

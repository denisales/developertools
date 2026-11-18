import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

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
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-dvh font-sans text-base leading-relaxed antialiased">
        <AppShell>{children}</AppShell>
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}

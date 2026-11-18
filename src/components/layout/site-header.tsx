"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Blocks,
  Menu,
  Moon,
  Search,
  Sun,
  X,
} from "lucide-react";
import { TOOLS_REGISTRY, getPriorityTools } from "@/config/tools-registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { ToolIcon } from "@/components/layout/tool-icon";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const [isDark, setIsDark] = React.useState(false);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    setIsDark(nextDark);
    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
    } catch {
      // Ignore storage errors
    }
  };

  const q = searchQuery.trim().toLowerCase();
  const filteredTools = q
    ? TOOLS_REGISTRY.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q))
      ).slice(0, 6)
    : [];

  const priorityTools = getPriorityTools();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        {/* Left: Mobile Drawer Trigger + Brand */}
        <div className="flex items-center gap-2.5">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menu de ferramentas"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto p-0">
              <SheetHeader className="border-b px-5 py-4 text-left">
                <SheetTitle className="flex items-center gap-2 text-base">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Blocks className="size-4" />
                  </div>
                  <span>4Devs & FinTools BR</span>
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Geradores, validadores e calculadoras para devs e investidores.
                </SheetDescription>
              </SheetHeader>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold tracking-tight transition-opacity hover:opacity-90"
          >
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Blocks className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base leading-none font-bold sm:text-lg">
                DevTools<span className="text-primary">BR</span>
              </span>
              <span className="hidden text-[11px] font-normal text-muted-foreground sm:inline">
                Suite 4Devs & Calculadoras
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Instant Quick Search */}
        <div className="relative flex-1 max-w-md">
          <div className="relative flex items-center">
            <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
              placeholder="Buscar CPF, CNPJ, Juros Compostos..."
              className="h-9 rounded-full bg-muted/60 pr-8 pl-9 text-sm focus-visible:bg-background"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          {/* Dropdown Search Results */}
          {searchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-11 right-0 left-0 z-50 overflow-hidden rounded-xl border bg-popover p-1.5 shadow-lg">
              {filteredTools.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Nenhuma ferramenta encontrada para &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {filteredTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onMouseDown={() => {
                        router.push(tool.href);
                        setSearchQuery("");
                      }}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <ToolIcon
                          name={tool.iconName}
                          className="size-4 shrink-0 text-primary"
                        />
                        <div className="truncate">
                          <div className="font-medium text-foreground">
                            {tool.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {tool.description}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={
                          tool.status === "ready" ? "default" : "secondary"
                        }
                        className="ml-2 shrink-0 text-[10px]"
                      >
                        {tool.status === "ready" ? "Ativo" : "Em breve"}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Quick Desktop Links + Theme Toggle */}
        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1 md:flex">
            {priorityTools.map((tool) => {
              const isActive = pathname === tool.href;
              return (
                <Link
                  key={tool.id}
                  href={tool.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {tool.shortName}
                </Link>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label="Alternar tema claro/escuro"
            className="rounded-full"
          >
            {isDark ? (
              <Sun className="size-4 text-amber-400" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Quick Access Bar (Horizontal Scrollable Pills) */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-t bg-muted/30 px-4 py-2 md:hidden">
        <Link
          href="/"
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
            pathname === "/"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground border"
          )}
        >
          Início
        </Link>
        {priorityTools.map((tool) => {
          const isActive = pathname === tool.href;
          return (
            <Link
              key={tool.id}
              href={tool.href}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-background text-foreground/80 border"
              )}
            >
              <ToolIcon name={tool.iconName} className="size-3" />
              <span>{tool.shortName}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Blocks,
  ChevronRight,
  Home,
  Menu,
  Moon,
  Search,
  Sparkles,
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

const THEME_CHANGE_EVENT = "devtools-theme-change";

function getThemeSnapshot(): boolean {
  try {
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme === "dark") return true;
    if (storedTheme === "light") return false;
  } catch {
    // Ignore storage errors
  }

  if (document.documentElement.classList.contains("dark")) {
    return true;
  }

  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function getThemeServerSnapshot(): boolean {
  return false;
}

function subscribeToTheme(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
  };
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const searchInputRef = React.useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = React.useRef<HTMLInputElement>(null);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchFocused, setSearchFocused] = React.useState(false);
  const isDark = React.useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setMobileSearchOpen((prev) => !prev);
        } else {
          searchInputRef.current?.focus();
        }
      } else if (e.key === "Escape" && mobileSearchOpen) {
        setMobileSearchOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileSearchOpen]);

  React.useEffect(() => {
    if (mobileSearchOpen) {
      const id = window.setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 40);
      return () => window.clearTimeout(id);
    }
  }, [mobileSearchOpen]);

  const toggleTheme = () => {
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
    } catch {
      // Ignore storage errors
    }
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const q = searchQuery.trim().toLowerCase();
  const priorityTools = React.useMemo(() => getPriorityTools(), []);
  const filteredTools = q
    ? TOOLS_REGISTRY.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.shortName.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.keywords.some((k) => k.toLowerCase().includes(q))
      ).slice(0, 6)
    : priorityTools;

  const activeTool = React.useMemo(
    () =>
      TOOLS_REGISTRY.find(
        (tool) => tool.status === "ready" && tool.href === pathname
      ),
    [pathname]
  );

  const handleSelectTool = (href: string) => {
    router.push(href);
    setSearchQuery("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="flex h-14 w-full items-center justify-between gap-2 px-3 sm:gap-4 sm:px-6 lg:px-8">
        {/* Left: Mobile Drawer Trigger + Brand + Contextual Breadcrumb */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="size-9 shrink-0 rounded-lg lg:hidden"
                aria-label="Abrir menu de ferramentas"
              >
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[82vw] max-w-[300px] overflow-y-auto p-0">
              <SheetHeader className="border-b px-4 py-3.5 text-left">
                <SheetTitle className="flex items-center gap-2.5 text-base font-bold">
                  <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
                    <Blocks className="size-4" />
                  </div>
                  <span>DevToolsBR</span>
                </SheetTitle>
                <SheetDescription className="text-xs leading-snug">
                  Geradores, validadores e calculadoras financeiras.
                </SheetDescription>
              </SheetHeader>
              <SidebarNav
                defaultExpanded={false}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 font-bold tracking-tight transition-opacity hover:opacity-90"
          >
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-2xs">
              <Blocks className="size-4" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base leading-none font-extrabold">
                DevTools<span className="text-primary">BR</span>
              </span>
              <span className="hidden text-xs font-medium text-muted-foreground xl:inline">
                Utilitários & Finanças
              </span>
            </div>
          </Link>

          {/* Contextual Desktop Breadcrumb */}
          <div className="hidden items-center gap-2 border-l border-border/80 pl-4 text-xs sm:text-sm md:flex">
            <Link
              href="/"
              className="flex items-center gap-1.5 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <Home className="size-3.5" />
              <span>Catálogo</span>
            </Link>
            {activeTool ? (
              <>
                <ChevronRight className="size-3.5 text-muted-foreground/60" />
                <span className="text-muted-foreground">
                  {activeTool.categoryLabel}
                </span>
                <ChevronRight className="size-3.5 text-muted-foreground/60" />
                <span className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  <ToolIcon name={activeTool.iconName} className="size-3.5" />
                  <span className="max-w-[200px] truncate xl:max-w-none">
                    {activeTool.shortName}
                  </span>
                </span>
              </>
            ) : (
              <>
                <ChevronRight className="size-3.5 text-muted-foreground/60" />
                <span className="inline-flex items-center gap-1.5 font-semibold text-foreground">
                  <Sparkles className="size-3.5 text-primary" />
                  <span>Visão Geral</span>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right: Mobile Search Trigger / Desktop Global Search + Theme Toggle */}
        <div className="flex shrink-0 items-center justify-end gap-2">
          {/* Mobile Search Button (< sm) */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setMobileSearchOpen((prev) => !prev)}
            aria-label="Buscar ferramenta"
            aria-expanded={mobileSearchOpen}
            className="h-9 gap-2 rounded-lg border-border/80 bg-muted/40 px-3 text-xs font-medium text-muted-foreground hover:text-foreground sm:hidden"
          >
            <Search className="size-3.5 text-foreground/80" />
            <span>Buscar...</span>
          </Button>

          {/* Desktop Inline Search (>= sm) */}
          <div className="relative hidden w-64 sm:block md:w-80 lg:w-96">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                placeholder="Buscar ferramenta (CPF, CNPJ, Juros)..."
                className="h-9 rounded-lg border-border/80 bg-muted/50 pr-12 pl-9 text-xs sm:text-sm transition-all focus-visible:bg-background"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2.5 rounded-md p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Limpar busca"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <kbd className="pointer-events-none absolute right-2.5 hidden h-5 items-center gap-0.5 rounded border bg-background px-1.5 font-mono text-xs font-medium text-muted-foreground shadow-2xs sm:inline-flex">
                  ⌘K
                </kbd>
              )}
            </div>

            {/* Desktop Dropdown Search Results (Wide 420px Popover) */}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-11 right-0 z-50 w-[420px] overflow-hidden rounded-xl border bg-popover p-2 shadow-2xl">
                {filteredTools.length === 0 ? (
                  <div className="px-4 py-5 text-center text-sm text-muted-foreground">
                    Nenhuma ferramenta encontrada para &ldquo;{searchQuery}&rdquo;
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {filteredTools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onMouseDown={() => handleSelectTool(tool.href)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent cursor-pointer"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <ToolIcon name={tool.iconName} className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-foreground">
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
                          className="shrink-0 text-xs"
                        >
                          {tool.status === "ready" ? "Ativo" : "Catálogo"}
                        </Badge>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label="Alternar tema claro/escuro"
            title={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
            className="size-9 shrink-0 rounded-lg"
          >
            {isDark ? (
              <Sun className="size-4 text-amber-400" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Full-Width Mobile Search Overlay (< sm) */}
      {mobileSearchOpen && (
        <>
          <div
            className="fixed inset-0 top-14 z-40 bg-black/40 backdrop-blur-xs sm:hidden"
            onClick={() => setMobileSearchOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Buscar ferramentas"
            className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-xl border bg-popover p-3 shadow-2xl sm:hidden"
          >
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
              <Input
                ref={mobileSearchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar CPF, CNPJ, Juros..."
                className="h-10 rounded-lg border-border/80 bg-muted/40 pr-9 pl-9 text-sm focus-visible:bg-background"
              />
              <button
                type="button"
                onClick={() => {
                  if (searchQuery) {
                    setSearchQuery("");
                    mobileSearchInputRef.current?.focus();
                  } else {
                    setMobileSearchOpen(false);
                  }
                }}
                className="absolute right-2.5 rounded-md p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label={searchQuery ? "Limpar busca" : "Fechar busca"}
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-2.5 max-h-[60vh] overflow-y-auto">
              <div className="mb-1.5 px-1 text-xs font-semibold text-muted-foreground">
                {q ? "Resultados da busca" : "Ferramentas Ativas"}
              </div>
              {filteredTools.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                  Nenhuma ferramenta encontrada para &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {filteredTools.map((tool) => (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => handleSelectTool(tool.href)}
                      className="flex w-full items-center justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-accent cursor-pointer"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                          <ToolIcon name={tool.iconName} className="size-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-foreground">
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
                        className="shrink-0 text-xs"
                      >
                        {tool.status === "ready" ? "Ativo" : "Breve"}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
}

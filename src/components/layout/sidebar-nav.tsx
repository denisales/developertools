"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutGrid, Sparkles } from "lucide-react";
import {
  TOOL_CATEGORIES,
  TOOLS_REGISTRY,
  getPriorityTools,
  type ToolCategory,
} from "@/config/tools-registry";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ToolIcon } from "@/components/layout/tool-icon";

interface SidebarNavProps {
  defaultExpanded?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function SidebarNav({
  defaultExpanded = false,
  onNavigate,
  className,
}: SidebarNavProps) {
  const pathname = usePathname();
  const priorityTools = React.useMemo(() => getPriorityTools(), []);
  const [openCategories, setOpenCategories] = React.useState<
    Record<ToolCategory, boolean>
  >(() => ({
    geradores: defaultExpanded,
    calculadoras: defaultExpanded,
    validadores: defaultExpanded,
    utilitarios: defaultExpanded,
  }));

  const toggleCategory = (catId: ToolCategory) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <nav className={cn("flex flex-col gap-4 px-3 py-3.5", className)}>
      {/* Visão Geral / Catálogo */}
      <div>
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all",
            pathname === "/"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-foreground/85 hover:bg-accent hover:text-foreground"
          )}
        >
          <LayoutGrid
            className={cn(
              "size-4 shrink-0",
              pathname === "/" ? "text-primary-foreground" : "text-primary"
            )}
          />
          <span>Visão Geral</span>
        </Link>
      </div>

      {/* Ferramentas Ativas (Acesso Imediato) */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 px-3 text-xs font-bold tracking-wider text-primary uppercase">
          <Sparkles className="size-3.5" />
          <span>Ferramentas Ativas</span>
        </div>
        <div className="flex flex-col gap-1">
          {priorityTools.map((tool) => {
            const isActive = pathname === tool.href;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "text-foreground/85 hover:bg-accent hover:text-foreground"
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <ToolIcon
                    name={tool.iconName}
                    className={cn(
                      "size-4 shrink-0",
                      isActive
                        ? "text-primary-foreground"
                        : "text-primary group-hover:text-primary"
                    )}
                  />
                  <span className="truncate">{tool.shortName}</span>
                </span>
                {tool.badge && (
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className="shrink-0 px-1.5 py-0 text-xs font-medium"
                  >
                    {tool.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Categorias do Catálogo */}
      <div className="border-t border-border/70 pt-3">
        <div className="mb-1.5 px-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
          Catálogo por Categoria
        </div>
        <div className="flex flex-col gap-1">
          {TOOL_CATEGORIES.map((category) => {
            const isOpen = openCategories[category.id];
            const tools = TOOLS_REGISTRY.filter(
              (t) => t.category === category.id
            );
            return (
              <div key={category.id} className="rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground cursor-pointer"
                >
                  <span>{category.shortLabel}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                      {tools.length}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-150",
                        isOpen && "rotate-180"
                      )}
                    />
                  </span>
                </button>

                {isOpen && (
                  <div className="mt-0.5 flex flex-col gap-0.5 pl-2">
                    {tools.map((tool) => {
                      const isActive =
                        pathname === tool.href.split("?")[0] &&
                        tool.status === "ready";
                      return (
                        <Link
                          key={tool.id}
                          href={tool.href}
                          onClick={onNavigate}
                          className={cn(
                            "flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors",
                            isActive
                              ? "bg-accent font-semibold text-foreground"
                              : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                          )}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <ToolIcon
                              name={tool.iconName}
                              className={cn(
                                "size-3.5 shrink-0",
                                isActive
                                  ? "text-primary"
                                  : "text-muted-foreground/80"
                              )}
                            />
                            <span className="truncate">{tool.shortName}</span>
                          </span>
                          {tool.status === "coming-soon" && (
                            <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                              Breve
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

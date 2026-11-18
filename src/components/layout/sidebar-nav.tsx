"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Sparkles } from "lucide-react";
import {
  TOOL_CATEGORIES,
  TOOLS_REGISTRY,
  getPriorityTools,
} from "@/config/tools-registry";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ToolIcon } from "@/components/layout/tool-icon";

interface SidebarNavProps {
  onNavigate?: () => void;
  className?: string;
}

export function SidebarNav({ onNavigate, className }: SidebarNavProps) {
  const pathname = usePathname();
  const priorityTools = getPriorityTools();

  return (
    <nav className={cn("flex flex-col gap-7 px-4 py-6", className)}>
      {/* Visão Geral / Catálogo */}
      <div>
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
            pathname === "/"
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-foreground/85 hover:bg-accent hover:text-foreground"
          )}
        >
          <LayoutGrid
            className={cn(
              "size-4 shrink-0",
              pathname === "/" ? "text-primary-foreground" : "text-primary"
            )}
          />
          <span>Painel de Ferramentas</span>
        </Link>
      </div>

      {/* Ferramentas Prioritárias */}
      <div>
        <div className="mb-2.5 flex items-center gap-2 px-3 text-xs font-bold tracking-wider text-primary uppercase">
          <Sparkles className="size-3.5" />
          <span>Mais Acessados</span>
        </div>
        <div className="flex flex-col gap-1.5">
          {priorityTools.map((tool) => {
            const isActive = pathname === tool.href;
            return (
              <Link
                key={tool.id}
                href={tool.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground/85 hover:bg-accent hover:text-foreground"
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
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
                    className="shrink-0 px-2 py-0.5 text-xs font-medium"
                  >
                    {tool.badge}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Categorias Completas */}
      {TOOL_CATEGORIES.map((category) => {
        const tools = TOOLS_REGISTRY.filter((t) => t.category === category.id);
        return (
          <div key={category.id}>
            <div className="mb-2 px-3 text-xs font-bold tracking-wider text-muted-foreground uppercase">
              {category.shortLabel}
            </div>
            <div className="flex flex-col gap-1">
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
                      "flex items-center justify-between gap-2 rounded-xl px-3.5 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-accent font-semibold text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <ToolIcon
                        name={tool.iconName}
                        className={cn(
                          "size-4 shrink-0",
                          isActive
                            ? "text-primary"
                            : "text-muted-foreground/80"
                        )}
                      />
                      <span className="truncate">{tool.shortName}</span>
                    </span>
                    {tool.status === "coming-soon" && (
                      <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Breve
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

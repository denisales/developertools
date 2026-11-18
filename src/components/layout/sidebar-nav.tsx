"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
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
    <nav className={cn("flex flex-col gap-6 py-4", className)}>
      {/* Ferramentas Prioritárias */}
      <div className="px-3">
        <div className="mb-2 flex items-center gap-1.5 px-2 text-xs font-semibold tracking-wider text-primary uppercase">
          <Sparkles className="size-3.5" />
          <span>Mais Acessados</span>
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
                  "group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-foreground/80 hover:bg-accent hover:text-foreground"
                )}
              >
                <span className="flex items-center gap-2.5 truncate">
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
                    className="ml-2 px-1.5 py-0 text-[10px]"
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
          <div key={category.id} className="px-3">
            <div className="mb-1.5 px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              {category.shortLabel}
            </div>
            <div className="flex flex-col gap-0.5">
              {tools.map((tool) => {
                const isActive = pathname === tool.href.split("?")[0] && tool.status === "ready";
                return (
                  <Link
                    key={tool.id}
                    href={tool.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <ToolIcon
                        name={tool.iconName}
                        className="size-3.5 shrink-0 opacity-75"
                      />
                      <span className="truncate">{tool.shortName}</span>
                    </span>
                    {tool.status === "coming-soon" && (
                      <span className="text-[10px] font-medium text-muted-foreground/70">
                        Em breve
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

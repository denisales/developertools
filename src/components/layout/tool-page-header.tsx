import * as React from "react";
import { cn } from "@/lib/utils";

export interface ToolPageHeaderProps {
  icon: React.ReactNode;
  iconClassName?: string;
  title: string;
  mobileTitle?: string;
  description: string;
  actions?: React.ReactNode;
}

/**
 * Cabeçalho canônico para todas as páginas de ferramentas.
 */
export function ToolPageHeader({
  icon,
  iconClassName = "bg-primary/10 text-primary",
  title,
  mobileTitle,
  description,
  actions,
}: ToolPageHeaderProps) {
  return (
    <header className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div
            className={cn(
              "flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-xl",
              iconClassName
            )}
          >
            {icon}
          </div>
          <h1 className="truncate text-lg sm:text-2xl font-bold tracking-tight">
            {mobileTitle ? (
              <>
                <span className="sm:hidden">{mobileTitle}</span>
                <span className="hidden sm:inline">{title}</span>
              </>
            ) : (
              title
            )}
          </h1>
        </div>

        {actions && (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-1 sm:line-clamp-none">
        {description}
      </p>
    </header>
  );
}

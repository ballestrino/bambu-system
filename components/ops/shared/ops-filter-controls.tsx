"use client";

import type { ComponentProps, ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type OpsFilterChip = {
  label: string;
  onRemove?: () => void;
};

export const opsFilterControlClass =
  "h-11! min-h-11 w-full rounded-[var(--ops-radius-control)] border-ops-border bg-ops-surface px-3 py-0 text-ops-text shadow-none transition-colors hover:bg-ops-surface-muted focus:border-ops-bamboo focus:ring-ops-bamboo/20 data-[size=default]:h-11!";

export const opsFilterInputClass =
  "h-11 min-h-11 w-full rounded-[var(--ops-radius-control)] border-ops-border bg-ops-surface px-3 py-0 text-sm text-ops-text shadow-none transition-colors hover:bg-ops-surface-muted focus-visible:border-ops-bamboo focus-visible:ring-ops-bamboo/20";

export const opsFilterToggleClass =
  "flex h-11 min-h-11 w-full items-center justify-between gap-3 rounded-[var(--ops-radius-control)] border border-ops-border bg-ops-surface px-3 py-0 text-sm text-ops-text shadow-none md:w-56";

export const opsSwitchClass =
  "data-[state=checked]:bg-[#53985E] data-[state=unchecked]:bg-[#E2EADF] dark:data-[state=unchecked]:bg-[#2D372C]";

export const OpsFilterField = ({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) => (
  <div className={cn("space-y-2", className)}>
    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </Label>
    {children}
  </div>
);

export const OpsDateFilterInput = ({
  className,
  ...props
}: ComponentProps<typeof Input>) => (
  <Input
    {...props}
    type="date"
    className={cn(
      opsFilterInputClass,
      "min-w-0 max-w-full [color-scheme:light] dark:[color-scheme:dark]",
      className
    )}
  />
);

export const OpsFilterChips = ({
  chips,
  className,
  onClear,
}: {
  chips: OpsFilterChip[];
  className?: string;
  onClear: () => void;
}) => {
  if (!chips.length) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {chips.map((chip) => (
        <Badge
          key={chip.label}
          variant="outline"
          className="gap-1 border-[#53985E]/25 bg-[#EAF5EC] text-[#244C2D] dark:bg-[#91AD71]/15 dark:text-[#D4E3B8]"
        >
          {chip.label}
          {chip.onRemove ? (
            <button
              type="button"
          className="rounded-full p-0.5 hover:bg-ops-bamboo-soft"
              onClick={chip.onRemove}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">Quitar filtro</span>
            </button>
          ) : null}
        </Badge>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-muted-foreground"
        onClick={onClear}
      >
        Limpiar
      </Button>
    </div>
  );
};

export const OpsFilterSheet = ({
  activeCount,
  children,
  description,
  onClear,
  title = "Filtros",
}: {
  activeCount: number;
  children: ReactNode;
  description?: string;
  onClear: () => void;
  title?: string;
}) => (
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline" className="min-h-11 shrink-0 border-ops-border shadow-none">
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {activeCount ? (
          <Badge className="ml-1 bg-ops-bamboo-strong text-white dark:text-[#18251D]">{activeCount}</Badge>
        ) : null}
      </Button>
    </SheetTrigger>
    <SheetContent side="right" className="w-[320px] bg-background">
      <SheetHeader>
        <SheetTitle>{title}</SheetTitle>
        {description ? (
          <SheetDescription>{description}</SheetDescription>
        ) : null}
      </SheetHeader>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
        {children}
      </div>
      <SheetFooter>
        <Button variant="outline" onClick={onClear}>
          Limpiar filtros
        </Button>
      </SheetFooter>
    </SheetContent>
  </Sheet>
);

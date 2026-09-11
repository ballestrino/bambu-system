"use client";

import { useEffect, useRef } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

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

export const OpsSearchInput = ({
  className,
  isSearching,
  placeholder,
  value,
  onChange,
  onSubmit,
}: {
  className?: string;
  isSearching?: boolean;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}) => {
  const trackRef = useRef<HTMLSpanElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const bar = barRef.current;

    if (!track || !bar) {
      return;
    }

    if (isSearching) {
      track.style.transitionDelay = "0ms";
      track.style.opacity = "1";
      const current = Number.parseFloat(bar.style.width) || 0;
      bar.style.width = `${current > 0 && current < 92 ? current : 12}%`;

      const intervalId = window.setInterval(() => {
        const value = Number.parseFloat(bar.style.width) || 0;
        bar.style.width = `${value >= 92 ? 92 : value + (92 - value) * 0.18 + 0.6}%`;
      }, 70);

      return () => window.clearInterval(intervalId);
    }

    if (!bar.style.width || bar.style.width === "0%") {
      return;
    }

    bar.style.width = "100%";
    track.style.transitionDelay = "200ms";
    track.style.opacity = "0";

    const timeoutId = window.setTimeout(() => {
      track.style.transitionDelay = "0ms";
      bar.style.width = "0%";
    }, 520);

    return () => window.clearTimeout(timeoutId);
  }, [isSearching]);

  return (
    <div
      className={cn(
        "group relative flex h-11 min-w-0 flex-1 items-center gap-2 rounded-[var(--ops-radius-control)] border border-ops-border bg-ops-surface px-3 text-ops-text shadow-none transition-all focus-within:border-ops-bamboo focus-within:ring-2 focus-within:ring-ops-bamboo/20",
        className
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-ops-bamboo transition-colors group-focus-within:text-ops-bamboo-strong" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit?.();
          }
        }}
        placeholder={placeholder}
        className="h-full min-w-0 border-0 bg-transparent px-0 py-0 text-sm leading-none shadow-none outline-none placeholder:text-ops-text-muted focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
      />
      {value ? (
        <button
          type="button"
          className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-ops-bamboo-soft hover:text-ops-bamboo-strong"
          onClick={() => onChange("")}
        >
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Limpiar búsqueda</span>
        </button>
      ) : null}
      {isSearching === undefined ? null : (
        <span
          ref={trackRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] overflow-hidden rounded-b-[inherit] bg-ops-bamboo/15 opacity-0 transition-opacity duration-300"
        >
          <span
            ref={barRef}
            className="block h-full w-0 rounded-r-full bg-ops-bamboo transition-[width] duration-150 ease-out"
          />
        </span>
      )}
    </div>
  );
};

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

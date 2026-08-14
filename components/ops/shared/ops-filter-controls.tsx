"use client";

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
  "h-12! min-h-12 w-full rounded-full border-[#53985E]/15 bg-white px-4 py-0 text-[#244C2D] shadow-sm shadow-[#244C2D]/5 transition-colors hover:bg-[#F7FBF7] focus:ring-[#53985E]/15 data-[size=default]:h-12! dark:bg-[#1A211A] dark:text-[#D4E3B8]";

export const opsFilterInputClass =
  "h-12 min-h-12 w-full rounded-full border-[#53985E]/15 bg-white px-4 py-0 text-sm text-[#244C2D] shadow-sm shadow-[#244C2D]/5 transition-colors hover:bg-[#F7FBF7] focus-visible:ring-[#53985E]/15 dark:bg-[#1A211A] dark:text-[#D4E3B8]";

export const opsFilterToggleClass =
  "flex h-12 min-h-12 w-full items-center justify-between gap-3 rounded-full border border-[#53985E]/15 bg-white px-4 py-0 text-sm text-[#244C2D] shadow-sm shadow-[#244C2D]/5 md:w-56 dark:bg-[#1A211A] dark:text-[#D4E3B8]";

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
  <Input {...props} type="date" className={cn(opsFilterInputClass, className)} />
);

export const OpsSearchInput = ({
  className,
  placeholder,
  value,
  onChange,
}: {
  className?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div
    className={cn(
      "group flex h-12 min-w-0 flex-1 items-center gap-2 rounded-full border border-[#53985E]/15 bg-white px-4 text-[#244C2D] shadow-sm shadow-[#244C2D]/5 transition-all focus-within:ring-2 focus-within:ring-[#53985E]/15 dark:bg-[#1A211A] dark:text-[#D4E3B8]",
      className
    )}
  >
    <Search className="h-4 w-4 shrink-0 text-[#53985E] transition-colors group-focus-within:text-[#244C2D] dark:group-focus-within:text-[#D4E3B8]" />
    <Input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-full min-w-0 border-0 bg-transparent px-0 py-0 text-sm leading-none shadow-none outline-none placeholder:text-[#244C2D]/45 focus-visible:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:placeholder:text-[#D4E3B8]/45"
    />
    {value ? (
      <button
        type="button"
        className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-[#53985E]/10 hover:text-[#244C2D] dark:hover:text-[#D4E3B8]"
        onClick={() => onChange("")}
      >
        <X className="h-3.5 w-3.5" />
        <span className="sr-only">Limpiar búsqueda</span>
      </button>
    ) : null}
  </div>
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
              className="rounded-full p-0.5 hover:bg-[#53985E]/10"
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
      <Button variant="outline" className="shrink-0 border-[#53985E]/25">
        <SlidersHorizontal className="h-4 w-4" />
        Filtros
        {activeCount ? (
          <Badge className="ml-1 bg-[#244C2D] text-white">{activeCount}</Badge>
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

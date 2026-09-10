"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { SearchableSelectOption } from "@/components/ui/searchable-select";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-UY")
    .trim();

type SearchableMultiSelectProps = {
  "aria-label"?: string;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
  onValueChange: (values: string[]) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  summaryLabel?: (count: number) => string;
  values: string[];
};

export const SearchableMultiSelect = ({
  "aria-label": ariaLabel,
  className,
  disabled,
  emptyMessage = "No se encontraron resultados.",
  onValueChange,
  options,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  summaryLabel = (count) => `${count} seleccionadas`,
  values,
}: SearchableMultiSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useIsMobile();
  const selected = new Set(values);
  const selectedOptions = options.filter((option) => selected.has(option.value));

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearch("");
  };
  const toggle = (value: string) =>
    onValueChange(
      selected.has(value)
        ? values.filter((current) => current !== value)
        : [...values, value]
    );

  const trigger = (
    <Button
      aria-label={ariaLabel}
      aria-expanded={open}
      className={cn("min-w-0 w-full justify-between font-normal", className)}
      disabled={disabled}
      role="combobox"
      type="button"
      variant="outline"
    >
      {selectedOptions.length === 0 ? (
        <span className="min-w-0 truncate text-muted-foreground">{placeholder}</span>
      ) : selectedOptions.length === 1 ? (
        <span className="min-w-0 truncate">{selectedOptions[0].label}</span>
      ) : (
        <Badge variant="secondary" className="rounded-sm font-normal">
          {summaryLabel(selectedOptions.length)}
        </Badge>
      )}
      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const command = (
    <Command
      className={cn(isMobile && "min-h-0 rounded-none bg-transparent")}
      filter={(_optionValue, query, keywords) =>
        normalizeSearchText(keywords?.join(" ") ?? "").includes(normalizeSearchText(query))
          ? 1
          : 0
      }
    >
      <CommandInput
        aria-label={searchPlaceholder}
        onValueChange={setSearch}
        placeholder={searchPlaceholder}
        value={search}
      />
      <CommandList className={cn(isMobile && "min-h-0 max-h-none flex-1 overscroll-contain")}>
        <CommandEmpty>{emptyMessage}</CommandEmpty>
        <CommandGroup>
          {options.map((option) => (
            <CommandItem
              disabled={option.disabled}
              key={option.value}
              keywords={[option.label, ...(option.keywords ?? [])]}
              onSelect={() => toggle(option.value)}
              value={option.value}
            >
              <span
                className={cn(
                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-ops-bamboo",
                  selected.has(option.value)
                    ? "bg-ops-bamboo text-white"
                    : "opacity-50 [&_svg]:invisible"
                )}
              >
                <Check className="h-3 w-3" />
              </span>
              <span className="min-w-0 truncate">{option.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {selectedOptions.length ? (
          <>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem className="justify-center" onSelect={() => onValueChange([])}>
                Limpiar selección
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent
          className="h-[min(72dvh,34rem)]! max-h-[calc(100dvh-0.5rem)] gap-0 overflow-hidden rounded-t-[var(--ops-radius-dialog)] border-ops-border bg-ops-surface p-0"
          onOpenAutoFocus={(event) => event.preventDefault()}
          side="bottom"
        >
          <SheetHeader className="border-b border-ops-border bg-ops-surface-muted px-4 pb-3 pt-4 text-left">
            <SheetTitle>{ariaLabel ?? "Seleccionar opciones"}</SheetTitle>
            <SheetDescription>Busca y marca las que necesites.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-hidden px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
            {command}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        collisionPadding={12}
        className="max-h-[min(22rem,calc(100dvh-1rem))] w-[var(--radix-popover-trigger-width)] overflow-hidden p-0"
      >
        {command}
      </PopoverContent>
    </Popover>
  );
};

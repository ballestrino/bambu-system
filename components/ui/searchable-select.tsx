"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  disabled?: boolean;
  keywords?: string[];
  label: string;
  value: string;
};

type SearchableSelectProps = {
  "aria-label"?: string;
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
  onValueChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  value: string;
};

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("es-UY")
    .trim();

export const SearchableSelect = ({
  "aria-label": ariaLabel,
  className,
  disabled,
  emptyMessage = "No se encontraron resultados.",
  onValueChange,
  options,
  placeholder = "Seleccionar...",
  searchPlaceholder = "Buscar...",
  value,
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selectedOption = options.find((option) => option.value === value);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearch("");
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          aria-label={ariaLabel}
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
          disabled={disabled}
          role="combobox"
          type="button"
          variant="outline"
        >
          <span className={cn("truncate", !selectedOption && "text-muted-foreground")}>
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command
          filter={(_optionValue, query, keywords) =>
            normalizeSearchText(keywords?.join(" ") ?? "").includes(
              normalizeSearchText(query)
            )
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
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  disabled={option.disabled}
                  key={option.value}
                  keywords={[option.label, ...(option.keywords ?? [])]}
                  onSelect={() => {
                    onValueChange(option.value);
                    handleOpenChange(false);
                  }}
                  value={option.value}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      option.value === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

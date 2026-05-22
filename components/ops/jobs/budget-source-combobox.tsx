"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, LoaderCircle } from "lucide-react";

import { opsFormSelectTriggerClass } from "@/components/ops/shared";
import type { OpsBudgetSource } from "@/components/ops/types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type BudgetSourceComboboxProps = {
  budgetSources: OpsBudgetSource[];
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  onBudgetChange: (budgetId: string) => void;
  onOptionChange: (budgetOptionId: string) => void;
  onSearchChange: (query: string) => void;
  search: string;
  selectedBudget?: OpsBudgetSource;
  sourceBudgetId: string;
};

export const BudgetSourceCombobox = ({
  budgetSources,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isFetchingNextPage,
  isLoading,
  onBudgetChange,
  onOptionChange,
  onSearchChange,
  search,
  selectedBudget,
  sourceBudgetId,
}: BudgetSourceComboboxProps) => {
  const [open, setOpen] = useState(false);
  const showInitialLoading = isLoading && budgetSources.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(opsFormSelectTriggerClass, "justify-between font-normal")}
        >
          <span className="truncate">
            {selectedBudget?.name ?? (showInitialLoading ? "Cargando..." : "Sin presupuesto")}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar presupuesto..."
            value={search}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandGroup>
              <CommandItem
                value="none"
                onSelect={() => {
                  onBudgetChange("");
                  onOptionChange("");
                  setOpen(false);
                }}
              >
                <Check className={cn("h-4 w-4", !sourceBudgetId ? "opacity-100" : "opacity-0")} />
                Sin presupuesto
              </CommandItem>
              {budgetSources.map((budget) => (
                <CommandItem
                  key={budget.id}
                  value={budget.id}
                  onSelect={() => {
                    onBudgetChange(budget.id);
                    onOptionChange("");
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      budget.id === sourceBudgetId ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{budget.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{budget.slug}</p>
                  </div>
                </CommandItem>
              ))}
              {showInitialLoading ? (
                <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Cargando presupuestos...
                </div>
              ) : null}
              {!showInitialLoading && budgetSources.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  No se encontraron presupuestos.
                </p>
              ) : null}
            </CommandGroup>
            {hasNextPage ? (
              <div className="border-t p-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  {isFetchingNextPage ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : null}
                  Cargar 5 más
                </Button>
              </div>
            ) : null}
            {isFetching && !isFetchingNextPage && !showInitialLoading ? (
              <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                Actualizando resultados...
              </p>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

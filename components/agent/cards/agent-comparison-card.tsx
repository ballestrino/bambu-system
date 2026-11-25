"use client";

import { Check, Copy, SlidersHorizontal, Table2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AgentCard } from "@/components/agent/cards/agent-card";
import { buildComparisonMarkdown } from "@/components/agent/cards/comparison-copy";
import {
  COMPARISON_FIELDS,
  DEFAULT_COMPARISON_FIELDS,
  OPTION_LABELS,
  hasAnyProducts,
  visibleComparisonFields,
  type ComparisonFieldId,
} from "@/components/agent/cards/comparison-fields";
import { saveComparisonPreference, useComparisonPreference } from "@/components/agent/cards/comparison-preference";
import type { ComparisonCardData } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pickComparisonOption, type ComparisonPriceOption } from "@/lib/agent/budget-comparison";
import { cn } from "@/lib/utils";

// La tabla comparativa de precios (feature 71): escenarios en columnas y
// campos en filas. Los campos y la opción de productos se eligen acá y se
// recuerdan en el navegador; "Copiar" deja la tabla visible en Markdown.
export function AgentComparisonCard({ data }: { data: ComparisonCardData }) {
  const preference = useComparisonPreference();
  const [copied, setCopied] = useState(false);
  const { columns } = data;
  const withProducts = hasAnyProducts(columns);
  const option: ComparisonPriceOption = withProducts ? preference.option : "without";
  const fields = visibleComparisonFields(preference.fields);
  const best = Math.max(...columns.map((column) => pickComparisonOption(column, option).profit));

  const save = (next: Partial<typeof preference>) => saveComparisonPreference({ ...preference, ...next });
  const toggleField = (id: ComparisonFieldId, checked: boolean) =>
    save({ fields: checked ? [...preference.fields, id] : preference.fields.filter((field) => field !== id) });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(
        buildComparisonMarkdown({ title: data.title, columns, fields: preference.fields, option })
      );
      setCopied(true);
      toast.success("Tabla copiada en Markdown");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <AgentCard
      icon={Table2}
      title={data.title}
      subtitle={`${columns.length} escenarios · ${OPTION_LABELS[option].toLowerCase()}`}
      aside={
        <Button variant="outline" size="sm" className="h-11 shrink-0 sm:h-8" onClick={() => void copy()}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          Copiar
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {withProducts && (
          <div role="group" aria-label="Precios" className="inline-flex rounded-lg border border-ops-border p-0.5">
            {(["without", "with"] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={option === value}
                onClick={() => save({ option: value })}
                className={cn(
                  "h-9 rounded-md px-2.5 text-xs font-medium sm:h-7",
                  option === value ? "bg-ops-bamboo-soft text-ops-bamboo-strong" : "text-ops-text-muted"
                )}
              >
                {OPTION_LABELS[value]}
              </button>
            ))}
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-10 sm:h-8">
              <SlidersHorizontal aria-hidden />
              Campos ({fields.length})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Qué mostrar</DropdownMenuLabel>
            {COMPARISON_FIELDS.map((field) => {
              const checked = preference.fields.includes(field.id);
              return (
                <DropdownMenuCheckboxItem
                  key={field.id}
                  checked={checked}
                  // El último campo marcado no se desmarca: la tabla quedaría vacía.
                  disabled={checked && fields.length === 1}
                  onCheckedChange={(value) => toggleField(field.id, value === true)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {field.label}
                </DropdownMenuCheckboxItem>
              );
            })}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => save({ fields: [...DEFAULT_COMPARISON_FIELDS] })}>
              Volver a los de siempre
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="-mx-3.5 overflow-x-auto px-3.5">
        <table className="w-full border-separate border-spacing-0 text-sm tabular-nums">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-ops-surface" />
              {columns.map((column, index) => (
                <th key={index} className="min-w-28 border-b border-ops-border px-2 pb-1.5 text-right align-bottom">
                  <span className="block text-xs font-semibold text-ops-text">{column.label}</span>
                  {option === "with" && !column.withProducts && (
                    <span className="block text-[11px] font-normal text-ops-text-muted">sin productos</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field.id} className={cn(field.strong && "font-semibold")}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-ops-border bg-ops-surface py-1.5 pr-3 text-left text-xs font-normal whitespace-nowrap text-ops-text-muted"
                >
                  {field.label}
                </th>
                {columns.map((column, index) => (
                  <td
                    key={index}
                    className={cn(
                      "border-b border-ops-border px-2 py-1.5 text-right",
                      field.id === "service" ? "text-xs font-normal text-ops-text-muted" : "whitespace-nowrap",
                      field.id === "profit" &&
                        columns.length > 1 &&
                        pickComparisonOption(column, option).profit === best &&
                        "text-ops-bamboo-strong"
                    )}
                  >
                    {field.value(column, option)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AgentCard>
  );
}

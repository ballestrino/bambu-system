"use client";

import { Check, ChevronDown, ChevronUp, Sparkles } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Piezas del selector de modelo y esfuerzo (agent-mode-select.tsx).
export const triggerClass = cn(
  "inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-ops-surface-muted px-2.5 text-[13px] font-semibold text-ops-bamboo-strong transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
  "sm:h-7 sm:gap-[5px] sm:rounded-lg sm:bg-transparent sm:px-2 sm:text-xs sm:font-medium sm:hover:bg-ops-bamboo-soft sm:data-[state=open]:bg-ops-bamboo-soft"
);
export const contentClass = "rounded-[14px] p-1.5 shadow-[var(--ops-shadow-elevated)]";
export const sectionLabelClass = "px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-ops-text-muted uppercase";

export function Chevrons() {
  return (
    <>
      <ChevronUp className="size-3.5 sm:hidden" aria-hidden />
      <ChevronDown className="hidden size-[13px] opacity-70 sm:block" aria-hidden />
    </>
  );
}

function RecommendedBadge() {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-ops-bamboo-soft px-1.5 py-px text-[10.5px] font-semibold text-ops-bamboo-strong">
      <Sparkles className="size-2.5" aria-hidden />
      Recomendado
    </span>
  );
}

// Una fila del menú: nombre (y "Recomendado"), costo por mensaje, descripción
// o la clave que falta, y el check de la elegida.
export function OptionRow({
  title,
  recommended,
  estimate,
  detail,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  recommended: boolean;
  estimate: string | null;
  detail: string | null;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const tone = selected ? "text-ops-bamboo-strong/80" : "text-ops-text-muted";
  return (
    <DropdownMenuItem
      onSelect={onSelect}
      disabled={disabled}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "min-h-12 items-start gap-2.5 rounded-[10px] px-2.5 py-2.5 sm:min-h-0 sm:py-2",
        selected && "bg-ops-bamboo-soft focus:bg-ops-bamboo-soft"
      )}
    >
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 self-center sm:self-auto">
        <span className="flex items-baseline justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                "truncate text-[15px] sm:text-[13px] sm:font-semibold",
                selected ? "font-semibold text-ops-bamboo-strong" : "font-medium"
              )}
            >
              {title}
            </span>
            {recommended && <RecommendedBadge />}
          </span>
          {estimate && <span className={cn("shrink-0 text-xs tabular-nums", tone)}>{estimate}</span>}
        </span>
        {detail && <span className={cn("text-xs leading-snug", tone)}>{detail}</span>}
      </span>
      <Check
        className={cn("mt-0.5 size-4 shrink-0 self-center text-ops-bamboo-strong sm:self-auto", !selected && "invisible")}
        aria-hidden
      />
    </DropdownMenuItem>
  );
}

"use client";

import { Check, ChevronDown, ChevronUp, Gauge } from "lucide-react";

import type { AgentSettings } from "@/components/agent/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AGENT_MODE_IDS,
  AGENT_MODES,
  DEFAULT_AGENT_MODE,
  DEFAULT_MODE_SPECS,
  type AgentMode,
} from "@/lib/ai/modes";
import { formatUsd } from "@/lib/ai/pricing";
import { cn } from "@/lib/utils";

type ModeOption = AgentSettings["modes"][number];

// Sin la configuración del servidor todavía, los modelos por defecto y sin
// costo estimado.
const toFallbackOption = (id: AgentMode): ModeOption => ({
  id,
  ...AGENT_MODES[id],
  ...DEFAULT_MODE_SPECS[id],
  estimatedCostUsd: null,
});

const FALLBACK_OPTIONS = AGENT_MODE_IDS.map(toFallbackOption);

const formatEstimate = (costUsd: number | null) =>
  costUsd === null ? null : `≈ ${formatUsd(costUsd)}`;

// Bajo, Medio o Alto para los turnos siguientes, junto al "+" del composer,
// con lo que cuesta un mensaje en cada uno (promedio real o estimado por
// tokens, ver lib/agent/message-cost-estimate.ts). El menú se abre sobre el
// composer: en escritorio con la descripción de cada modo y, en el teléfono,
// compacto y con lo gastado en la conversación al pie (footer, que se esconde
// solo en escritorio).
export function AgentModeSelect({
  mode,
  modes,
  onChange,
  footer,
}: {
  mode: AgentMode;
  modes: ModeOption[] | null;
  onChange: (mode: AgentMode) => void;
  footer?: React.ReactNode;
}) {
  const options = modes ?? FALLBACK_OPTIONS;
  const active =
    options.find((option) => option.id === mode) ?? toFallbackOption(DEFAULT_AGENT_MODE);
  const activeEstimate = formatEstimate(active.estimatedCostUsd);

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Modo ${active.label}. Cambiar el modo de los próximos mensajes`}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1 rounded-full bg-ops-surface-muted px-2.5 text-[13px] font-semibold text-ops-bamboo-strong transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              "sm:h-7 sm:gap-[5px] sm:rounded-lg sm:bg-transparent sm:px-2 sm:text-xs sm:font-medium sm:hover:bg-ops-bamboo-soft sm:data-[state=open]:bg-ops-bamboo-soft"
            )}
          >
            <Gauge className="hidden size-3.5 sm:block" aria-hidden />
            {active.label}
            <ChevronUp className="size-3.5 sm:hidden" aria-hidden />
            <ChevronDown className="hidden size-[13px] opacity-70 sm:block" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={10}
          className="w-[270px] rounded-[14px] p-1.5 shadow-[var(--ops-shadow-elevated)] sm:w-[340px]"
        >
          <DropdownMenuLabel className="hidden px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wider text-ops-text-muted uppercase sm:block">
            Modo de los próximos mensajes
          </DropdownMenuLabel>
          {options.map((option) => {
            const selected = option.id === mode;
            const estimate = formatEstimate(option.estimatedCostUsd);
            return (
              <DropdownMenuItem
                key={option.id}
                onSelect={() => onChange(option.id)}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "min-h-12 items-start gap-2.5 rounded-[10px] px-2.5 py-2.5 sm:min-h-0 sm:py-2",
                  selected && "bg-ops-bamboo-soft focus:bg-ops-bamboo-soft"
                )}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5 self-center sm:self-auto">
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "text-[15px] sm:text-[13px] sm:font-semibold",
                        selected ? "font-semibold text-ops-bamboo-strong" : "font-medium"
                      )}
                    >
                      {option.label}
                    </span>
                    {estimate && (
                      <span className={cn("text-xs tabular-nums", selected ? "text-ops-bamboo-strong/80" : "text-ops-text-muted")}>
                        {estimate}
                      </span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "hidden text-xs leading-snug sm:block",
                      selected ? "text-ops-bamboo-strong/80" : "text-ops-text-muted"
                    )}
                  >
                    {option.description}
                  </span>
                </span>
                <Check
                  className={cn("mt-0.5 size-4 shrink-0 self-center text-ops-bamboo-strong sm:self-auto", !selected && "invisible")}
                  aria-hidden
                />
              </DropdownMenuItem>
            );
          })}
          {footer}
        </DropdownMenuContent>
      </DropdownMenu>
      {activeEstimate && (
        <span className="hidden truncate text-[11px] text-ops-text-muted tabular-nums sm:inline">
          {activeEstimate} por mensaje
        </span>
      )}
    </div>
  );
}

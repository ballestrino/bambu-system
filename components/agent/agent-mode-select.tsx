"use client";

import type { AgentSettings } from "@/components/agent/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AGENT_MODE_IDS,
  AGENT_MODES,
  DEFAULT_AGENT_MODE,
  DEFAULT_MODE_SPECS,
  isAgentMode,
  type AgentMode,
} from "@/lib/ai/modes";
import { formatUsd } from "@/lib/ai/pricing";

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

// Bajo, Medio o Alto para los turnos siguientes, con lo que cuesta un mensaje
// en cada uno (promedio real o estimado por tokens, ver
// lib/agent/message-cost-estimate.ts).
export function AgentModeSelect({
  mode,
  modes,
  onChange,
}: {
  mode: AgentMode;
  modes: ModeOption[] | null;
  onChange: (mode: AgentMode) => void;
}) {
  const options = modes ?? FALLBACK_OPTIONS;
  const active =
    options.find((option) => option.id === mode) ?? toFallbackOption(DEFAULT_AGENT_MODE);
  const activeEstimate = formatEstimate(active.estimatedCostUsd);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Select value={mode} onValueChange={(value) => isAgentMode(value) && onChange(value)}>
        {/* La altura va con la misma variante data-[size=sm] del primitivo. */}
        <SelectTrigger
          size="sm"
          className="gap-1 px-2 text-xs data-[size=sm]:h-8 sm:data-[size=sm]:h-7"
          aria-label={`Modo ${active.label}`}
        >
          <SelectValue>{active.label}</SelectValue>
        </SelectTrigger>
        <SelectContent position="popper" align="start">
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id} className="text-xs">
              <span className="font-medium">{option.label}</span>
              {option.estimatedCostUsd !== null && (
                <span className="text-muted-foreground tabular-nums">
                  {formatEstimate(option.estimatedCostUsd)} por mensaje
                </span>
              )}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activeEstimate && (
        <span className="truncate text-xs text-muted-foreground tabular-nums">
          {activeEstimate} por mensaje
        </span>
      )}
    </div>
  );
}

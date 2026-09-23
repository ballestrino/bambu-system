"use client";

import { Gauge } from "lucide-react";

import type { AgentSettings } from "@/components/agent/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatModelLabel } from "@/lib/agent/usage-format";
import {
  AGENT_MODE_IDS,
  AGENT_MODES,
  DEFAULT_MODE_SPECS,
  isAgentMode,
  type AgentMode,
} from "@/lib/ai/modes";

type ModeOption = AgentSettings["modes"][number];

// Sin la configuración del servidor todavía, los modelos por defecto.
const FALLBACK_OPTIONS: ModeOption[] = AGENT_MODE_IDS.map((id) => ({
  id,
  ...AGENT_MODES[id],
  ...DEFAULT_MODE_SPECS[id],
}));

// Bajo, Medio o Alto para los turnos siguientes. El tooltip y cada opción
// dicen qué modelo y qué razonamiento usa (con los overrides del entorno).
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
  const active = options.find((option) => option.id === mode) ?? FALLBACK_OPTIONS[1];
  return (
    <Select value={mode} onValueChange={(value) => isAgentMode(value) && onChange(value)}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* La altura va con la misma variante data-[size=sm] del primitivo:
              un h-11 suelto pierde contra ella y el target queda en 32px. */}
          <SelectTrigger
            size="sm"
            className="gap-1.5 data-[size=sm]:h-11 sm:data-[size=sm]:h-8"
            aria-label={`Modo ${active.label}`}
          >
            <Gauge aria-hidden />
            <SelectValue>{active.label}</SelectValue>
          </SelectTrigger>
        </TooltipTrigger>
        <TooltipContent>
          {formatModelLabel(active.modelId)} ({active.modelId}) · razonamiento {active.reasoning}
        </TooltipContent>
      </Tooltip>
      <SelectContent position="popper" align="start">
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id} className="py-2">
            <span className="flex flex-col items-start">
              <span className="font-medium">
                {option.label} · {formatModelLabel(option.modelId)}
              </span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

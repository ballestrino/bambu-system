"use client";

import { Gauge } from "lucide-react";

import {
  FALLBACK_MODE_OPTIONS,
  choiceMissingKey,
  choiceOptions,
  choicesByVendor,
  findModeOption,
  formatChoiceEstimate,
  formatEstimate,
  type ModeOption,
} from "@/components/agent/agent-mode-options";
import {
  Chevrons,
  OptionRow,
  contentClass,
  sectionLabelClass,
  triggerClass,
} from "@/components/agent/agent-mode-option-row";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MODEL_VENDOR_LABELS,
  defaultModeForChoice,
  findModelChoice,
  type AgentModelChoice,
} from "@/lib/ai/model-choices";
import { REASONING_LABELS, type AgentMode } from "@/lib/ai/modes";
import { cn } from "@/lib/utils";

// Modelo y esfuerzo de los próximos mensajes, junto al "+" del composer, con
// lo que cuesta un mensaje en cada uno (promedio real o estimado por tokens,
// ver lib/agent/message-cost-estimate.ts). Al cambiar de modelo se elige su
// esfuerzo recomendado o el primero. Un modelo sin clave se ve deshabilitado
// con la variable que falta. En el teléfono, lo gastado en la conversación va
// al pie del menú del modelo (footer, que se esconde solo en escritorio).
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
  const options = modes ?? FALLBACK_MODE_OPTIONS;
  const active = findModeOption(options, mode);
  const activeChoice = findModelChoice(mode);
  const efforts = choiceOptions(activeChoice, options);
  const activeEstimate = formatEstimate(active.estimatedCostUsd);
  const effortLabel = REASONING_LABELS[active.reasoning];
  const vendors = choicesByVendor();

  const renderChoice = (choice: AgentModelChoice) => {
    const choiceModes = choiceOptions(choice, options);
    const missingKey = choiceMissingKey(choiceModes);
    return (
      <OptionRow
        key={choice.id}
        title={choice.label}
        recommended={choiceModes.some((option) => option.recommended)}
        estimate={formatChoiceEstimate(choiceModes)}
        detail={missingKey ? `Falta configurar ${missingKey}` : choice.description}
        selected={choice.id === activeChoice.id}
        disabled={Boolean(missingKey)}
        onSelect={() => choice.id !== activeChoice.id && onChange(defaultModeForChoice(choice))}
      />
    );
  };

  return (
    <div className="flex min-w-0 items-center gap-1 sm:gap-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Modelo ${activeChoice.label}. Cambiar el modelo de los próximos mensajes`}
            className={triggerClass}
          >
            <Gauge className="hidden size-3.5 sm:block" aria-hidden />
            {activeChoice.label}
            <Chevrons />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" sideOffset={10} className={cn(contentClass, "w-[290px] sm:w-[360px]")}>
          <DropdownMenuLabel className={sectionLabelClass}>{MODEL_VENDOR_LABELS.anthropic}</DropdownMenuLabel>
          {vendors.anthropic.map(renderChoice)}
          <DropdownMenuSeparator />
          <DropdownMenuLabel className={sectionLabelClass}>{MODEL_VENDOR_LABELS.openai}</DropdownMenuLabel>
          {vendors.openai.map(renderChoice)}
          {footer}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={`Esfuerzo ${effortLabel}. Cambiar el esfuerzo de ${activeChoice.label}`}
            className={triggerClass}
          >
            {effortLabel}
            <Chevrons />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" sideOffset={10} className={cn(contentClass, "w-[250px] sm:w-[280px]")}>
          <DropdownMenuLabel className={sectionLabelClass}>Esfuerzo de {activeChoice.label}</DropdownMenuLabel>
          {efforts.map((option) => (
            <OptionRow
              key={option.id}
              title={REASONING_LABELS[option.reasoning]}
              recommended={option.recommended}
              estimate={formatEstimate(option.estimatedCostUsd)}
              detail={option.missingKey ? `Falta configurar ${option.missingKey}` : null}
              selected={option.id === mode}
              disabled={Boolean(option.missingKey)}
              onSelect={() => onChange(option.id)}
            />
          ))}
          {efforts.length === 1 && (
            <p className="px-2.5 pt-1 pb-1.5 text-xs text-ops-text-muted">Es el único esfuerzo disponible para este modelo.</p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {activeEstimate && (
        <span className="ml-1 hidden truncate text-[11px] text-ops-text-muted tabular-nums sm:inline">
          {activeEstimate} por mensaje
        </span>
      )}
    </div>
  );
}

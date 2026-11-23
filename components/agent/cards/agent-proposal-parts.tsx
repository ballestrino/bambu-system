"use client";

import { Check, Pencil, type LucideIcon } from "lucide-react";

import { useBudgetOpener } from "@/components/agent/cards/agent-budget-actions";
import { memoryLine } from "@/components/agent/cards/agent-memory-details";
import { changesLine } from "@/components/agent/cards/proposal-copy";
import { formatHours, formatVisits } from "@/components/agent/format";
import type { BudgetEditorTarget } from "@/components/agent/hooks/use-budget-editor";
import { Button } from "@/components/ui/button";
import type { AgentProposalKind, ProposalSummary } from "@/lib/agent/proposals";
import { cn } from "@/lib/utils";

// Piezas de la tarjeta de propuesta: la cabecera desplegada, los botones y
// qué dice cada propuesta en su título.

// El título: el nombre de lo que se toca. Una memoria es su texto; una regla
// del equipo va en el cuerpo, antes y después.
export const proposalHeadline = (kind: AgentProposalKind, summary: ProposalSummary) =>
  kind === "SAVE_MEMORY"
    ? (summary.memory?.text ?? summary.name)
    : kind === "CHANGE_INSTRUCTIONS"
      ? "Instrucciones del equipo"
      : summary.name || summary.title;

const inputsLine = (inputs: ProposalSummary["inputs"]) =>
  inputs
    ? [
        formatVisits(inputs.visits, inputs.visitType),
        `${formatHours(inputs.hoursPerVisit)} por visita`,
        `${inputs.employees} ${inputs.employees === 1 ? "empleada" : "empleadas"}`,
      ].join(" · ")
    : null;

export const proposalSubtitle = (kind: AgentProposalKind, summary: ProposalSummary) => {
  if (kind === "SAVE_MEMORY") return summary.memory ? memoryLine(summary.memory) : null;
  if (kind === "CHANGE_INSTRUCTIONS") return null;
  const slug = summary.slug && kind !== "DUPLICATE_BUDGET" ? `/${summary.slug}` : null;
  return changesLine(summary) ?? (kind === "CREATE_BUDGET" ? inputsLine(summary.inputs) : null) ?? slug;
};

export function ProposalHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  badge,
  chevron,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  subtitle: string | null;
  // El estado: a la derecha con lugar; en el hilo angosto, debajo del
  // subtítulo, para no apretar el título.
  badge: React.ReactNode;
  chevron: React.ReactNode;
}) {
  return (
    <header className="flex items-start gap-2.5 py-3 pr-2 pl-3.5">
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-ops-bamboo-soft text-ops-bamboo-strong">
        <Icon className="size-[17px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ops-bamboo-strong">{eyebrow}</p>
        <h3 className="mt-px text-[15px] leading-snug font-semibold text-pretty break-words">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs leading-snug break-words text-ops-text-muted">{subtitle}</p>}
        <div className="mt-1.5 @md/thread:hidden">{badge}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden @md/thread:inline-flex">{badge}</span>
        {chevron}
      </div>
    </header>
  );
}

const base = "h-11 rounded-[10px] font-semibold sm:h-[34px]";

export function RejectButton({ disabled, onClick, className }: { disabled: boolean; onClick: () => void; className?: string }) {
  return (
    <Button variant="outline" className={cn(base, "text-ops-text-muted", className)} disabled={disabled} onClick={onClick}>
      Rechazar
    </Button>
  );
}

export function ConfirmButton({
  label,
  disabled,
  onClick,
  className,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      className={cn(base, "min-w-0 bg-ops-bamboo-strong text-ops-surface hover:bg-ops-bamboo-strong/90", className)}
      disabled={disabled}
      onClick={onClick}
    >
      <Check aria-hidden />
      <span className="truncate">{label}</span>
    </Button>
  );
}

// "Editar" de una propuesta de crear: abre el editor con sus valores. En la
// línea plegada va solo el ícono.
export function ProposalEditButton({
  target,
  iconOnly,
  disabled,
  className,
}: {
  target: BudgetEditorTarget;
  iconOnly?: boolean;
  disabled: boolean;
  className?: string;
}) {
  const { open, locked } = useBudgetOpener(target);
  if (locked) return null;
  return (
    <Button
      variant="outline"
      className={cn(base, iconOnly && "w-11 shrink-0 px-0 sm:w-[34px]", className)}
      disabled={disabled}
      onClick={() => open("edit")}
      aria-label={iconOnly ? "Editar el presupuesto" : undefined}
      title={iconOnly ? "Editar" : undefined}
    >
      <Pencil aria-hidden />
      {!iconOnly && "Editar"}
    </Button>
  );
}

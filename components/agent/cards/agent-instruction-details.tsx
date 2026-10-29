import type { InstructionSummary } from "@/lib/agent/team-instructions";

const LABELS = { ADD: "Regla nueva", UPDATE: "Cambia", REMOVE: "Se quita" } as const;

// La regla antes y después: la de antes en rojo y tachada, la nueva en verde.
export function AgentInstructionDetails({ instruction }: { instruction: InstructionSummary }) {
  return (
    <div className="space-y-1.5 rounded-[10px] border border-ops-border px-3 py-2.5 text-[13px] leading-snug">
      <p className="text-xs text-ops-text-muted">{LABELS[instruction.action]}</p>
      {instruction.before && (
        <p className="rounded-md bg-red-50 px-2 py-1 text-red-800 line-through decoration-red-800/50 dark:bg-red-500/15 dark:text-red-200">
          <span className="sr-only">Antes: </span>
          {instruction.before}
        </p>
      )}
      {instruction.after && (
        <p className="rounded-md bg-ops-bamboo-soft px-2 py-1 font-medium text-ops-bamboo-strong">
          <span className="sr-only">Después: </span>
          {instruction.after}
        </p>
      )}
    </div>
  );
}

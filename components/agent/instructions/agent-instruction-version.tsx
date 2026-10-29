"use client";

import { ChevronRight, RotateCcw } from "lucide-react";
import Link from "next/link";

import { formatDateTime } from "@/components/agent/format";
import type { AgentInstructionVersionRow } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import { getAgentPageUrl } from "@/lib/agent/page-url";
import type { InstructionChange } from "@/lib/agent/team-instructions";

// Qué cambió en una versión, en una línea.
const describeChange = (change: InstructionChange) => {
  if (change.action === "RESTORE") return `Restauró la versión ${change.restoredFrom}`;
  if (change.action === "ADD") return `Agregó: ${change.after}`;
  if (change.action === "REMOVE") return `Quitó: ${change.before}`;
  return `Cambió: ${change.before} → ${change.after}`;
};

export function AgentRuleList({ rules }: { rules: AgentInstructionVersionRow["rules"] }) {
  if (!rules.length) return <p className="text-sm text-ops-text-muted">Sin reglas del equipo.</p>;
  return (
    <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-snug marker:text-ops-text-muted">
      {rules.map((rule) => (
        <li key={rule.id}>{rule.text}</li>
      ))}
    </ol>
  );
}

// Una versión del historial: qué cambió, quién, cuándo y de qué conversación
// salió. Plegada muestra solo eso; abierta, las reglas que tenía.
export function AgentInstructionVersion({
  row,
  current,
  onRestore,
}: {
  row: AgentInstructionVersionRow;
  current: boolean;
  onRestore: (row: AgentInstructionVersionRow) => void;
}) {
  return (
    <li>
      <details className="group">
        <summary className="flex cursor-pointer list-none items-start gap-3 px-4 py-3 hover:bg-ops-surface-muted [&::-webkit-details-marker]:hidden">
          <ChevronRight
            className="mt-0.5 size-4 shrink-0 text-ops-text-muted transition-transform group-open:rotate-90"
            aria-hidden
          />
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="text-sm leading-snug">
              <span className="font-semibold">Versión {row.version}</span>
              {current && <span className="ml-2 text-xs font-medium text-ops-bamboo-strong">vigente</span>}
            </p>
            <p className="text-sm leading-snug break-words text-ops-text-muted">{describeChange(row.change)}</p>
            <p className="text-xs text-ops-text-muted">
              {formatDateTime(row.createdAt)}
              {row.createdBy && ` · ${row.createdBy}`}
            </p>
          </div>
        </summary>
        <div className="space-y-3 px-4 pb-4 pl-11">
          <AgentRuleList rules={row.rules} />
          <div className="flex flex-wrap items-center gap-3">
            {!current && (
              <Button variant="outline" className="h-11 sm:h-8" onClick={() => onRestore(row)}>
                <RotateCcw aria-hidden />
                Restaurar esta versión
              </Button>
            )}
            {row.conversation && (
              <Link
                href={getAgentPageUrl(row.conversation.id)}
                className="text-xs text-ops-text-muted underline-offset-4 hover:text-ops-text hover:underline"
              >
                De “{row.conversation.title}”
              </Link>
            )}
          </div>
        </div>
      </details>
    </li>
  );
}

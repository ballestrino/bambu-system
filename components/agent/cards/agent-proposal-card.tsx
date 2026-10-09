"use client";

import { AlertTriangle, Check, FileCheck2 } from "lucide-react";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
import { AgentBudgetActions } from "@/components/agent/cards/agent-budget-actions";
import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import { AgentProposalDetails } from "@/components/agent/cards/agent-proposal-details";
import { ProposalOutcome, ProposalStatusBadge } from "@/components/agent/cards/agent-proposal-status";
import { formatDateTime } from "@/components/agent/format";
import type { BudgetEditorTarget } from "@/components/agent/hooks/use-budget-editor";
import type { ProposalCardData } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import { valuesFromInputs } from "@/lib/agent/budget-draft";
import { canActOnProposal, getDisplayStatus } from "@/lib/agent/proposal-outcome";
import type { AgentProposalDto, AgentProposalKind } from "@/lib/agent/proposals";

// Lo que pasa al confirmar, dicho antes del botón.
const CONFIRM_TEXT: Record<AgentProposalKind, string> = {
  CREATE_BUDGET: "Confirmar crea el presupuesto.",
  UPDATE_BUDGET: "Confirmar guarda estos cambios en el presupuesto.",
  DUPLICATE_BUDGET: "Confirmar crea la copia.",
  PUBLISH_OFFICIAL_BUDGET: "Confirmar publica el precio de lista oficial.",
};

// Una propuesta de crear se puede ver y editar antes de guardarla: los
// valores vivos (quizás ya editados), o los de la tarjeta, o sus insumos.
const createTarget = (
  data: ProposalCardData,
  live: AgentProposalDto | undefined,
  toolCallId: string
): BudgetEditorTarget | null => {
  const summary = live?.summary ?? data.summary;
  const values =
    live?.values ??
    ("values" in data ? data.values : undefined) ??
    (summary.inputs ? valuesFromInputs(summary.inputs, summary.name) : null);
  if (data.kind !== "CREATE_BUDGET" || !values) return null;
  return { toolCallId, source: "proposal", title: summary.title, values, basedOn: null };
};

// La propuesta con su estado vivo (no el de la salida guardada de la tool,
// que dice PENDING para siempre) y su resumen vivo: si se guardó editada, el
// de lo que se guardó. Confirmar ejecuta la acción existente.
export function AgentProposalCard({ data, toolCallId }: { data: ProposalCardData; toolCallId: string }) {
  const { proposals, busyProposalId, confirmProposal, rejectProposal } = useAgentChatContext();
  const live = proposals?.get(data.proposalId);
  const status = getDisplayStatus(live, data.status);
  const summary = live?.summary ?? data.summary;
  const target = createTarget(data, live, toolCallId);
  const busy = busyProposalId === data.proposalId;
  const canAct = canActOnProposal(status, live, busyProposalId);

  const footer =
    status === "PENDING" ? (
      <>
        <p className="min-w-0 flex-[1_1_220px] text-xs leading-snug text-ops-text-muted">
          {CONFIRM_TEXT[data.kind]} Vence el {formatDateTime(live?.expiresAt ?? data.expiresAt)}.
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            variant="outline"
            className="h-11 flex-1 rounded-[10px] font-semibold sm:h-[34px]"
            disabled={!canAct}
            onClick={() => rejectProposal(data.proposalId)}
          >
            Rechazar
          </Button>
          <Button
            className="h-11 flex-1 rounded-[10px] bg-ops-bamboo-strong font-semibold text-ops-surface hover:bg-ops-bamboo-strong/90 sm:h-[34px]"
            disabled={!canAct}
            onClick={() => confirmProposal(data.proposalId)}
          >
            <Check aria-hidden />
            {busy ? "Guardando…" : "Confirmar"}
          </Button>
        </div>
      </>
    ) : (
      <ProposalOutcome status={status} live={live} slug={summary.slug} />
    );

  return (
    <AgentCard
      icon={FileCheck2}
      title={summary.title}
      subtitle={summary.slug && data.kind !== "DUPLICATE_BUDGET" ? `/${summary.slug}` : null}
      aside={<ProposalStatusBadge status={busy ? "EXECUTING" : status} />}
      footer={footer}
    >
      <AgentProposalDetails summary={summary} />

      {summary.warnings.length > 0 && (
        <ul className="space-y-1.5 rounded-[10px] bg-amber-50 px-3 py-2 text-xs leading-snug text-amber-800 dark:bg-amber-500/15 dark:text-amber-200">
          {summary.warnings.map((warning) => (
            <li key={warning} className="flex gap-2">
              <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
              <span>{warning}</span>
            </li>
          ))}
        </ul>
      )}
      {data.kind === "UPDATE_BUDGET" && (
        <CardNote>
          Avisos calculados al proponer
          {live ? ` (${formatDateTime(live.createdAt)})` : ""}: los trabajos vinculados pueden haber cambiado.
        </CardNote>
      )}

      {target && <AgentBudgetActions target={target} showSaved={false} />}
    </AgentCard>
  );
}

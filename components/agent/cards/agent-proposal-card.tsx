"use client";

import { AlertTriangle, FileCheck2 } from "lucide-react";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
import type { BudgetEditorTarget } from "@/components/agent/budget-editor/use-budget-editor";
import { AgentBudgetActions } from "@/components/agent/cards/agent-budget-actions";
import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import { AgentProposalDetails } from "@/components/agent/cards/agent-proposal-details";
import {
  getDisplayStatus,
  ProposalOutcome,
  ProposalStatusBadge,
} from "@/components/agent/cards/agent-proposal-status";
import { formatDateTime } from "@/components/agent/format";
import type { ProposalCardData } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import { valuesFromInputs } from "@/lib/agent/budget-draft";
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
  const canAct = status === "PENDING" && Boolean(live) && !busyProposalId;

  return (
    <AgentCard
      icon={FileCheck2}
      title={summary.title}
      subtitle={summary.slug && data.kind !== "DUPLICATE_BUDGET" ? `/${summary.slug}` : null}
      aside={<ProposalStatusBadge status={busy ? "EXECUTING" : status} />}
    >
      <AgentProposalDetails summary={summary} />

      {summary.warnings.length > 0 && (
        <ul className="space-y-1">
          {summary.warnings.map((warning) => (
            <li key={warning} className="flex gap-2 text-xs text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
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

      {status === "PENDING" ? (
        <div className="space-y-2 border-t pt-2">
          <CardNote>
            {CONFIRM_TEXT[data.kind]} Vence el {formatDateTime(live?.expiresAt ?? data.expiresAt)}.
          </CardNote>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              disabled={!canAct}
              onClick={() => rejectProposal(data.proposalId)}
            >
              Rechazar
            </Button>
            <Button className="h-11 sm:h-9" disabled={!canAct} onClick={() => confirmProposal(data.proposalId)}>
              {busy ? "Guardando…" : "Confirmar"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-t pt-2">
          <ProposalOutcome status={status} live={live} slug={summary.slug} />
        </div>
      )}
    </AgentCard>
  );
}

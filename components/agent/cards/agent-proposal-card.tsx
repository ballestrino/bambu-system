"use client";

import { AlertTriangle, Brain, CalendarDays, FileCheck2, ScrollText } from "lucide-react";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
import { proposalCardId } from "@/components/agent/agent-pending-bar";
import { AgentBudgetActions } from "@/components/agent/cards/agent-budget-actions";
import { CardNote } from "@/components/agent/cards/agent-card";
import { AgentProposalDetails } from "@/components/agent/cards/agent-proposal-details";
import { FoldChevron, FoldedProposalLine, FoldMarker } from "@/components/agent/cards/agent-proposal-lines";
import { ConfirmButton, ProposalEditButton, ProposalHeader, RejectButton, proposalHeadline, proposalSubtitle } from "@/components/agent/cards/agent-proposal-parts";
import { AgentProposalReceipt } from "@/components/agent/cards/agent-proposal-receipt";
import { ProposalOutcome, ProposalStatusBadge } from "@/components/agent/cards/agent-proposal-status";
import { confirmLabel, countClashes, expiryText, proposalEyebrow, proposalFigure } from "@/components/agent/cards/proposal-copy";
import type { BudgetEditorTarget } from "@/components/agent/hooks/use-budget-editor";
import { useProposalFold } from "@/components/agent/hooks/use-proposal-fold";
import { useVisitSelection } from "@/components/agent/hooks/use-visit-selection";
import type { ProposalCardData } from "@/components/agent/types";
import { Button } from "@/components/ui/button";
import { valuesFromInputs } from "@/lib/agent/budget-draft";
import { canActOnProposal, getDisplayStatus } from "@/lib/agent/proposal-outcome";
import type { AgentProposalDto, AgentProposalKind } from "@/lib/agent/proposals";
import { isVisitProposalKind } from "@/lib/agent/visit-proposals";
import { cn } from "@/lib/utils";

// Lo que conviene saber antes de confirmar, al pie, junto al vencimiento.
const HINTS: Partial<Record<AgentProposalKind, string>> = {
  PUBLISH_OFFICIAL_BUDGET: "Pasa a ser el precio de lista vigente.",
  SAVE_MEMORY: "El agente lo usa en todas las conversaciones.",
  CHANGE_INSTRUCTIONS: "Las instrucciones anteriores se pueden restaurar.",
};

const iconFor = (kind: AgentProposalKind) =>
  kind === "SAVE_MEMORY" ? Brain : kind === "CHANGE_INSTRUCTIONS" ? ScrollText : isVisitProposalKind(kind) ? CalendarDays : FileCheck2;

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
// de lo que se guardó. Confirmar ejecuta la acción existente. Se pliega en
// cualquier momento (feature 69): pendiente, a una línea con sus acciones;
// resuelta, a un recibo con el link a lo que quedó.
export function AgentProposalCard({ data, toolCallId }: { data: ProposalCardData; toolCallId: string }) {
  const { proposals, busyProposalId, confirmProposal, rejectProposal } = useAgentChatContext();
  const live = proposals?.get(data.proposalId);
  const status = getDisplayStatus(live, data.status);
  const summary = live?.summary ?? data.summary;
  const target = createTarget(data, live, toolCallId);
  const busy = busyProposalId === data.proposalId;
  const canAct = canActOnProposal(status, live, busyProposalId);
  const visits = useVisitSelection({ proposalId: data.proposalId, kind: data.kind, items: summary.items, status, result: live?.result, canAct });
  const display = busy ? "EXECUTING" : status;
  const active = display === "PENDING" || display === "EXECUTING";
  const fold = useProposalFold(active);
  const icon = iconFor(data.kind);
  const headline = proposalHeadline(data.kind, summary);

  const label = busy ? "Guardando…" : confirmLabel(data.kind, visits.checkedCount);
  const reject = () => rejectProposal(data.proposalId);
  const confirm = () => confirmProposal(data.proposalId, visits.visitIndexes);
  const pendingActions = (folded: boolean) =>
    status === "PENDING" || busy ? (
      <>
        <RejectButton disabled={!canAct} onClick={reject} className={folded ? "flex-1 px-2 @lg/thread:flex-none @lg/thread:px-3" : cn("order-last @md/thread:order-none", !target && "col-span-2")} />
        {target && <ProposalEditButton target={target} iconOnly={folded} disabled={!canAct} />}
        <ConfirmButton
          label={label}
          disabled={!canAct || !visits.canConfirm}
          onClick={confirm}
          className={folded ? "flex-[2] px-2 [&>svg]:hidden @lg/thread:flex-none @lg/thread:px-3 @lg/thread:[&>svg]:block" : "order-first col-span-2 @md/thread:order-none"}
        />
      </>
    ) : null;
  const chevron = <FoldChevron open={fold.open} onClick={fold.toggle} label={active ? undefined : fold.open ? "Plegar el detalle" : "Ver el detalle"} />;

  let content: React.ReactNode;
  if (!fold.open && active) {
    content = (
      <FoldedProposalLine
        icon={icon}
        title={headline}
        figure={proposalFigure(data.kind, summary, visits.checkedCount)}
        marker={<FoldMarker clashes={countClashes(summary, visits.checked)} warnings={summary.warnings.length} onUnfold={fold.unfold} />}
        actions={pendingActions(true)}
        chevron={chevron}
      />
    );
  } else if (!fold.open && display !== "PENDING" && display !== "EXECUTING") {
    content = <AgentProposalReceipt kind={data.kind} status={display} summary={summary} live={live} chevron={chevron} />;
  } else {
    content = (
      <>
        <ProposalHeader
          icon={icon}
          eyebrow={proposalEyebrow(data.kind, summary)}
          title={headline}
          subtitle={proposalSubtitle(data.kind, summary)}
          badge={<ProposalStatusBadge status={display} />}
          chevron={chevron}
        />
        <div className="space-y-3 px-3.5 pb-3.5 text-sm">
          {visits.checkedCount !== null && summary.items && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-ops-text-muted">
              <span>
                {visits.checkedCount} de {summary.items.length} marcadas
              </span>
              {visits.dropClashes && (
                <Button variant="ghost" className="h-11 rounded-[10px] px-2.5 font-semibold text-ops-bamboo-strong sm:h-7" onClick={visits.dropClashes}>
                  {countClashes(summary, visits.checked) === 1 ? "Sacar la que se cruza" : "Sacar las que se cruzan"}
                </Button>
              )}
            </div>
          )}
          <AgentProposalDetails summary={summary} selection={visits.selection} />
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
          {isVisitProposalKind(data.kind) && <CardNote>Horarios de Montevideo.</CardNote>}
          {target && <AgentBudgetActions target={target} showSaved={false} showEdit={false} />}
        </div>
        <footer className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-ops-border bg-ops-canvas px-3.5 py-2.5">
          {active ? (
            <>
              <p className="min-w-0 flex-[1_1_200px] text-xs leading-snug text-ops-text-muted">
                {[visits.confirmText ?? HINTS[data.kind], `${expiryText(live?.expiresAt ?? data.expiresAt)}.`].filter(Boolean).join(" ")}
              </p>
              {/* En el teléfono: confirmar a todo el ancho y debajo Editar y Rechazar. */}
              <div className="grid w-full grid-cols-2 gap-2 @md/thread:flex @md/thread:w-auto">{pendingActions(false)}</div>
            </>
          ) : (
            <ProposalOutcome status={display} live={live} slug={summary.slug} kind={data.kind} />
          )}
        </footer>
      </>
    );
  }

  return (
    <section
      id={proposalCardId(data.proposalId)}
      tabIndex={-1}
      aria-label={`Propuesta: ${proposalEyebrow(data.kind, summary).toLowerCase()} ${headline}`}
      className={cn(
        "scroll-mt-4 overflow-hidden rounded-[14px] border bg-ops-surface text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        active
          ? "border-ops-bamboo/35 shadow-[0_1px_2px_rgb(24_37_29/0.04),0_8px_24px_rgb(24_37_29/0.07)]"
          : "border-ops-border"
      )}
    >
      {content}
    </section>
  );
}

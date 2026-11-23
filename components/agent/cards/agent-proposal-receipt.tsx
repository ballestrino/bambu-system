"use client";

import { AlertTriangle, ArrowUpRight, Check, Clock, Loader2, X } from "lucide-react";
import Link from "next/link";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
import { ProposalReceiptLine } from "@/components/agent/cards/agent-proposal-lines";
import { ProposalOutcome } from "@/components/agent/cards/agent-proposal-status";
import { receiptText, requestAgainText } from "@/components/agent/cards/proposal-copy";
import { Button } from "@/components/ui/button";
import type { ProposalDisplayStatus } from "@/lib/agent/proposal-outcome";
import type { AgentProposalDto, AgentProposalKind, ProposalSummary } from "@/lib/agent/proposals";
import { isVisitProposalKind } from "@/lib/agent/visit-proposals";

const linkClass =
  "inline-flex h-11 shrink-0 items-center gap-0.5 rounded-lg px-2 text-xs font-semibold text-ops-bamboo-strong underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none sm:h-8";

const ICONS = {
  CONFIRMED: { icon: Check, tone: "bamboo" },
  EXECUTING: { icon: Loader2, tone: "muted" },
  REJECTED: { icon: X, tone: "muted" },
  EXPIRED: { icon: Clock, tone: "muted" },
  FAILED: { icon: AlertTriangle, tone: "warning" },
  UNKNOWN: { icon: AlertTriangle, tone: "warning" },
} as const;

// Dónde quedó: un presupuesto se abre en el panel del chat (no saca de la
// conversación); las visitas, la memoria y las reglas, en su página.
function ResultLink({ kind, live }: { kind: AgentProposalKind; live: AgentProposalDto | undefined }) {
  const { openSavedBudget, openOfficialBudget } = useAgentChatContext();
  const result = live?.result;
  if (!result) return null;
  if (kind === "PUBLISH_OFFICIAL_BUDGET" && result.officialBudgetId) {
    const id = result.officialBudgetId;
    return (
      <button type="button" className={linkClass} onClick={() => openOfficialBudget(id)}>
        Abrir
        <ArrowUpRight className="size-[13px]" aria-hidden />
      </button>
    );
  }
  if (result.slug && !isVisitProposalKind(kind)) {
    const slug = result.slug;
    return (
      <button type="button" className={linkClass} onClick={() => openSavedBudget(slug)}>
        Abrir
        <ArrowUpRight className="size-[13px]" aria-hidden />
      </button>
    );
  }
  return (
    <Link href={result.url} className={linkClass}>
      {isVisitProposalKind(kind) ? "Ver en Visitas" : "Abrir"}
      <ArrowUpRight className="size-[13px]" aria-hidden />
    </Link>
  );
}

// La línea de una propuesta resuelta (o guardándose, si está plegada).
// Vencida o fallida: "Pedir de nuevo" le escribe al agente.
export function AgentProposalReceipt({
  kind,
  status,
  summary,
  live,
  chevron,
}: {
  kind: AgentProposalKind;
  status: Exclude<ProposalDisplayStatus, "PENDING">;
  summary: ProposalSummary;
  live: AgentProposalDto | undefined;
  chevron: React.ReactNode;
}) {
  const { sendMessage, busy } = useAgentChatContext();
  const text = receiptText(kind, status, summary, live?.result);
  const { icon, tone } = ICONS[status];
  const canRetry = status === "EXPIRED" || status === "FAILED";
  return (
    <ProposalReceiptLine
      icon={icon}
      tone={tone}
      title={text?.title ?? ""}
      detail={text?.detail ?? null}
      note={status === "FAILED" || status === "UNKNOWN" ? <ProposalOutcome status={status} live={live} slug={summary.slug} kind={kind} /> : null}
      actions={
        <>
          {status === "CONFIRMED" && <ResultLink kind={kind} live={live} />}
          {canRetry && (
            <Button
              variant="outline"
              className="h-11 shrink-0 rounded-[10px] px-3 font-semibold sm:h-8"
              disabled={busy}
              onClick={() => sendMessage(requestAgainText(summary, status))}
            >
              Pedir de nuevo
            </Button>
          )}
        </>
      }
      chevron={chevron}
    />
  );
}

"use client";

import { FileText, History, SquarePen } from "lucide-react";
import Link from "next/link";

import { AgentCostBadge } from "@/components/agent/agent-cost-badge";
import { AgentModeSelect } from "@/components/agent/agent-mode-select";
import type { AgentSession } from "@/components/agent/hooks/use-agent-session";
import { Button } from "@/components/ui/button";
import { pageContextLabel } from "@/lib/agent/conversation-scope";
import { getBudgetUrl } from "@/lib/agent/proposals";

// Cabecera de la conversación en la página: título, presupuesto (con link al
// presupuesto), nueva conversación, modo con su costo por mensaje y, a la
// derecha, lo gastado en la conversación. El historial va en la
// columna; si el panel no tiene lugar para ella, en su diálogo. En una columna
// angosta va en dos filas.
export function AgentPageHeader({
  session,
  onOpenHistory,
  onOpenCosts,
}: {
  session: AgentSession;
  onOpenHistory: () => void;
  onOpenCosts: () => void;
}) {
  const budget = session.conversation?.budget ?? null;
  return (
    <header className="flex flex-col gap-2 border-b px-3 py-2 sm:px-4 @xl/chat:flex-row @xl/chat:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 sm:size-9 @4xl/panel:hidden"
          onClick={onOpenHistory}
          aria-label="Historial de conversaciones"
          title="Historial"
        >
          <History aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold">{session.title ?? "Nueva conversación"}</h2>
          {budget ? (
            <Link
              href={getBudgetUrl(budget.slug)}
              className="inline-flex max-w-full items-center gap-1 py-1 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              <FileText className="size-3 shrink-0" aria-hidden />
              <span className="min-w-0 truncate">{pageContextLabel(budget)}</span>
            </Link>
          ) : (
            <p className="truncate py-1 text-xs text-muted-foreground">{pageContextLabel(null)}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 sm:size-9"
          onClick={session.startNew}
          aria-label="Nueva conversación"
          title="Nueva conversación"
        >
          <SquarePen aria-hidden />
        </Button>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <AgentModeSelect mode={session.mode} modes={session.modes} onChange={session.changeMode} />
        <AgentCostBadge
          conversationId={session.conversationId}
          persisted={session.persisted}
          onClick={onOpenCosts}
        />
      </div>
    </header>
  );
}

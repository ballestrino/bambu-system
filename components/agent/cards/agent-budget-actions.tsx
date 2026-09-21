"use client";

import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
import type { BudgetEditorTarget } from "@/components/agent/budget-editor/use-budget-editor";
import { CardNote } from "@/components/agent/cards/agent-card";
import { Button } from "@/components/ui/button";
import { isBudgetLocked } from "@/lib/agent/budget-draft";

// "Ver detalle" y "Editar" de un presupuesto que armó el agente: los dos
// abren el editor. La tarjeta de un cálculo muestra además si ya se guardó en
// el generador (la de una propuesta ya dice su estado). Si ya hay propuesta,
// el editor parte de sus valores: lo que se guardó (o se intentó guardar),
// no lo que calculó el agente.
export function AgentBudgetActions({ target, showSaved }: { target: BudgetEditorTarget; showSaved: boolean }) {
  const { openBudget, proposalForCall, hasBudgetDraft } = useAgentChatContext();
  const proposal = proposalForCall(target.toolCallId);
  const locked = isBudgetLocked(proposal?.status);
  const saved = proposal?.status === "CONFIRMED" ? proposal.result : null;
  const open = (tab: "detail" | "edit") =>
    openBudget(proposal?.values ? { ...target, values: proposal.values } : target, tab);

  return (
    <div className="space-y-2 border-t pt-2">
      {showSaved && saved && (
        <CardNote>
          Guardado en el generador:{" "}
          <Link href={saved.url} className="text-primary underline-offset-4 hover:underline">
            {saved.label}
          </Link>
        </CardNote>
      )}
      {showSaved && proposal?.status === "EXECUTING" && <CardNote>Guardando en el generador…</CardNote>}
      {showSaved && proposal?.status === "FAILED" && proposal.error && (
        <CardNote tone="warning">No se pudo guardar: {proposal.error}</CardNote>
      )}
      {!locked && hasBudgetDraft(target.toolCallId) && <CardNote>Tenés cambios sin guardar.</CardNote>}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" className="h-11 sm:h-9" onClick={() => open("detail")}>
          <Eye aria-hidden />
          Ver detalle
        </Button>
        {!locked && (
          <Button variant="outline" className="h-11 sm:h-9" onClick={() => open("edit")}>
            <Pencil aria-hidden />
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}

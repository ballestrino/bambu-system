"use client";

import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

import { useAgentChatContext } from "@/components/agent/agent-chat-context";
import type { BudgetEditorTarget } from "@/components/agent/hooks/use-budget-editor";
import { CardNote } from "@/components/agent/cards/agent-card";
import { Button } from "@/components/ui/button";
import { isBudgetLocked } from "@/lib/agent/budget-draft";

// En el teléfono los botones se reparten el ancho; en escritorio van a su
// medida, a la izquierda.
const buttonClass = "h-11 flex-1 rounded-[10px] font-semibold sm:h-[34px] sm:flex-none";

// "Ver detalle" y "Editar" de un presupuesto que armó el agente: los dos
// abren el editor. La tarjeta de un cálculo muestra además si ya se guardó en
// el generador (la de una propuesta ya dice su estado). Si ya hay propuesta,
// el editor parte de sus valores: lo que se guardó (o se intentó guardar),
// no lo que calculó el agente.
export const useBudgetOpener = (target: BudgetEditorTarget) => {
  const { openBudget, proposalForCall } = useAgentChatContext();
  const proposal = proposalForCall(target.toolCallId);
  const open = (tab: "detail" | "edit") =>
    openBudget(proposal?.values ? { ...target, values: proposal.values } : target, tab);
  return { proposal, open, locked: isBudgetLocked(proposal?.status) };
};

// showEdit false: la tarjeta de propuesta lleva Editar en su pie (y en la
// línea plegada), al lado de Confirmar.
export function AgentBudgetActions({
  target,
  showSaved,
  showEdit = true,
}: {
  target: BudgetEditorTarget;
  showSaved: boolean;
  showEdit?: boolean;
}) {
  const { hasBudgetDraft } = useAgentChatContext();
  const { proposal, open, locked } = useBudgetOpener(target);
  const saved = proposal?.status === "CONFIRMED" ? proposal.result : null;
  // Con un borrador, "Confirmar" de la tarjeta guardaría la propuesta sin él.
  const confirmable = target.source === "proposal" && proposal?.status === "PENDING";

  return (
    <div className="space-y-2">
      {showSaved && saved && (
        <CardNote>
          Guardado en el generador:{" "}
          <Link href={saved.url} className="text-ops-bamboo-strong underline-offset-4 hover:underline">
            {saved.label}
          </Link>
        </CardNote>
      )}
      {showSaved && proposal?.status === "EXECUTING" && !proposal.unknownOutcome && (
        <CardNote>Guardando en el generador…</CardNote>
      )}
      {showSaved && proposal?.status === "EXECUTING" && proposal.unknownOutcome && (
        <CardNote tone="warning">
          Se cortó mientras se guardaba: no se sabe si quedó guardado. Revisá el generador antes de volver a guardarlo.
        </CardNote>
      )}
      {showSaved && proposal?.status === "FAILED" && proposal.error && (
        <CardNote tone="warning">No se pudo guardar: {proposal.error}</CardNote>
      )}
      {!locked && hasBudgetDraft(target.toolCallId) && (
        <CardNote tone={confirmable ? "warning" : "muted"}>
          {confirmable
            ? "Tenés cambios sin guardar en el editor: Confirmar guarda la propuesta sin ellos. Para guardarlos, usá Guardar en el generador del editor."
            : "Tenés cambios sin guardar."}
        </CardNote>
      )}
      <div className="flex gap-2">
        <Button variant="outline" className={buttonClass} onClick={() => open("detail")}>
          <Eye aria-hidden />
          Ver detalle
        </Button>
        {!locked && showEdit && (
          <Button variant="outline" className={buttonClass} onClick={() => open("edit")}>
            <Pencil aria-hidden />
            Editar
          </Button>
        )}
      </div>
    </div>
  );
}

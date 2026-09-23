"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AgentCostDialog } from "@/components/agent/agent-cost-dialog";
import { AgentHistoryDialog } from "@/components/agent/agent-history-dialog";
import { AgentSessionBody } from "@/components/agent/agent-session-body";
import { AgentSheetHeader } from "@/components/agent/agent-sheet-header";
import { useAgentSession } from "@/components/agent/hooks/use-agent-session";
import { AIButton } from "@/components/budgets/create-budget/AiButton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { budgetConversationScope } from "@/lib/agent/conversation-scope";
import { sanitizeFormContextValues } from "@/lib/agent/form-context";
import { savedSlugRedirect } from "@/lib/agent/proposal-outcome";
import { getBudgetUrl, type ProposalResult } from "@/lib/agent/proposals";
import type { AgentBudgetContextInput } from "@/schemas/agent";
import type { BudgetFormValues } from "@/schemas/BudgetSchema";

type AgentSheetHostProps = {
  // Presupuesto guardado: el servidor lo lee fresco en cada turno.
  budgetId?: string;
  budgetSlug?: string;
  budgetName?: string;
  // Formulario sin guardar: se lee al enviar, no en cada tecla.
  getFormValues?: () => Partial<BudgetFormValues>;
  trigger?: React.ReactNode;
};

// El agente en un Sheet, sin saber de qué pantalla viene: lo que cambia es el
// contexto (presupuesto guardado o formulario) y el botón que lo abre.
export function AgentSheetHost({ budgetId, budgetSlug, budgetName, getFormValues, trigger }: AgentSheetHostProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<"history" | "costs" | null>(null);
  const scope = budgetConversationScope(budgetId ?? null);
  const session = useAgentSession({ scope });

  const contextLabel = budgetId
    ? `Presupuesto: ${budgetName ?? "guardado"}`
    : getFormValues
      ? "Formulario sin guardar"
      : "Sin presupuesto";

  const getContext = (): AgentBudgetContextInput | undefined => {
    if (budgetId) return { kind: "saved", budgetId };
    if (getFormValues) return { kind: "form", values: sanitizeFormContextValues(getFormValues()) };
    return undefined;
  };

  // Guardar cambios con otro nombre cambia la dirección del presupuesto
  // abierto: igual que el formulario de edición, se va a la nueva.
  const handleProposalConfirmed = (result: ProposalResult | null) => {
    const slug = savedSlugRedirect(result, { budgetId: budgetId ?? null, budgetSlug: budgetSlug ?? null });
    if (slug) router.replace(getBudgetUrl(slug));
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void session.ensureStarted();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {trigger ? (
        <SheetTrigger asChild>{trigger}</SheetTrigger>
      ) : (
        <div className="fixed inset-x-0 bottom-10 z-40 mx-auto w-fit">
          <SheetTrigger asChild>
            <AIButton className="h-auto rounded-full px-6 py-3 text-lg transition-transform hover:scale-105" />
          </SheetTrigger>
        </div>
      )}
      <SheetContent className="flex h-full w-full flex-col gap-0 p-0 sm:w-[600px] sm:max-w-[600px] [&>button]:hidden">
        <TooltipProvider>
          <AgentSheetHeader
            session={session}
            contextLabel={contextLabel}
            onOpenHistory={() => setDialog("history")}
            onOpenCosts={() => setDialog("costs")}
          />
          <AgentSessionBody
            session={session}
            contextLabel={contextLabel}
            getContext={getContext}
            onProposalConfirmed={handleProposalConfirmed}
          />
          <AgentHistoryDialog
            open={dialog === "history"}
            onOpenChange={(next) => setDialog(next ? "history" : null)}
            scope={scope}
            activeId={session.conversationId}
            onSelect={(id) => {
              setDialog(null);
              if (id !== session.conversationId) void session.openConversation(id);
            }}
            onDeleted={session.onConversationDeleted}
            onOpenCosts={() => setDialog("costs")}
          />
          <AgentCostDialog
            open={dialog === "costs"}
            onOpenChange={(next) => setDialog(next ? "costs" : null)}
            conversationId={session.persisted ? session.conversationId : null}
          />
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  );
}

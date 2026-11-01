"use client";

import type { Chat } from "@ai-sdk/react";

import type { AgentUIMessage } from "@/components/agent/types";
import { BillingAgent } from "@/components/billing/billing-agent";
import { useInvoiceFormPatches } from "@/components/billing/hooks/use-invoice-form-patches";
import type { NewInvoiceForm } from "@/lib/billing/new-invoice";

type Props = {
  getForm: () => NewInvoiceForm;
  month: string;
  onOpenChange: (open: boolean) => void;
  onPatch: (patch: Partial<NewInvoiceForm>) => void;
};

function InvoiceFormListener({ chat, onPatch }: { chat: Chat<AgentUIMessage>; onPatch: Props["onPatch"] }) {
  useInvoiceFormPatches(chat, onPatch);
  return null;
}

// El agente dentro de Nueva factura (feature 46, docs/billing.md): el mismo
// panel de Facturación, con la habilidad Nueva factura y el formulario como
// contexto de cada turno. Lo que completa (fillInvoiceForm) entra al
// formulario apenas llega; emitir y guardar siguen siendo los botones de la
// página. Cada vez que se abre la página arranca una conversación nueva.
export function NewInvoiceAgent({ getForm, month, onOpenChange, onPatch }: Props) {
  return (
    <BillingAgent
      contextLabel="Nueva factura"
      getContext={() => ({ form: getForm(), kind: "new-invoice", month })}
      onOpenChange={onOpenChange}
      renderListener={(chat) => <InvoiceFormListener chat={chat} key={chat.id} onPatch={onPatch} />}
      resumeLatest={false}
      skill="factura"
    />
  );
}

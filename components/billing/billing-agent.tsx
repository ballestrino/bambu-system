"use client";

import { AgentFloatingPanel, type AgentFloatingPanelProps } from "@/components/agent/agent-floating-panel";
import { BILLING_AGENT_CONVERSATIONS } from "@/lib/agent/conversation-scope";

type Props = Omit<AgentFloatingPanelProps, "scope" | "contextLabel" | "freshKey"> & { contextLabel?: string };

// El agente en Facturación (docs/billing.md, "Diseño"): la habilidad
// Facturación con su historial y el mes que se mira como contexto. Lo que
// cambia en el borrador se ve al terminar cada turno (refreshAfterTurn relee
// el mes). Nueva factura lo usa con su formulario como contexto y la
// habilidad Nueva factura (feature 46).
export function BillingAgent({ contextLabel = "Facturación", skill = "facturacion", ...props }: Props) {
  return <AgentFloatingPanel scope={BILLING_AGENT_CONVERSATIONS} contextLabel={contextLabel} skill={skill} {...props} />;
}

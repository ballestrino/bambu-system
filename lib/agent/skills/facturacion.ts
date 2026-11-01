import type { AgentSkill } from "@/lib/agent/skills/types";

// La habilidad de la página Facturación (docs/billing.md, "Agente"): lee lo
// facturado y arma el borrador del mes. Emitir no es una tool: lo hace una
// persona desde la página (BILLING_RULE, check:billing).
export const facturacionSkill: AgentSkill = {
  id: "facturacion",
  label: "Facturación",
  description: "El resumen de facturación, las facturas del mes y el borrador del mes que viene.",
  instructions: [
    "Habilidad activa: Facturación.",
    "- Para armar el mes: draftInvoices con repeatPreviousMonth true y, en la misma llamada, los cambios pedidos (desmarcar, precios, detalle). Si el borrador ya existe, se cambia ese.",
    "- Antes de cambiar facturas puntuales, buscalas con listInvoices (which draft) para tener su id y sus líneas. Si un nombre encaja con más de una, preguntá cuál.",
    "- Un precio nuevo se pide sin IVA. Si el usuario da un importe con IVA, decilo y preguntá antes de cambiarlo.",
    "- Para comparar con el mes anterior usá getBillingSummary; los trabajos y cobros de Bambú salen de queryOperations y getFinancialSnapshot.",
    "- Al terminar, decí cuántas facturas quedan marcadas y por cuánto (los importes de la tarjeta) y que se emiten desde Facturación.",
  ].join("\n"),
  tools: [
    "getBillingSummary",
    "listInvoices",
    "getInvoice",
    "lookupRut",
    "draftInvoices",
    "queryOperations",
    "getFinancialSnapshot",
    "searchMemory",
    "proposeMemory",
    "proposeInstructionChange",
  ],
  suggestions: [
    "Armá el borrador de este mes repitiendo el anterior",
    "¿Cuánto facturamos este mes contra el anterior?",
    "Subí 10 % el precio de todas las facturas del borrador",
    "Emití las facturas del mes",
  ],
};

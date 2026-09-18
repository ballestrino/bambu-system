import type { AgentSkill } from "@/lib/agent/skills/types";

export const emailsSkill: AgentSkill = {
  id: "emails",
  label: "Emails",
  description: "Correos y mensajes de WhatsApp para clientes.",
  instructions: [
    "Habilidad activa: Emails.",
    "- Los correos y mensajes de WhatsApp para clientes se escriben con draftEmail, no en el chat. Después de la tool, comentá en una línea qué incluye el borrador.",
    "- Antes de redactar conseguí los importes con una tool: el presupuesto (getBudget), un precio oficial vigente (searchOfficialBudgets o getOfficialBudget) o un cálculo (calculateBudget). draftEmail solo acepta importes que salieron de esas tools en esta conversación.",
    "- En el brief de draftEmail poné cliente, servicio, alcance, las opciones de precio que van y el tono. Si piden WhatsApp, usá channel whatsapp: más corto y sin formato.",
    "- Si draftEmail falla por un importe sin fuente o distinto, conseguilo con una tool y reintentá. Si falla por la nota de Literal E, pedí de nuevo el borrador aclarando que la nota es obligatoria.",
    "- Si no hay ningún importe con fuente, redactá sin precios y ofrecé calcularlos.",
  ].join("\n"),
  tools: [
    "searchBudgets",
    "getBudget",
    "searchOfficialBudgets",
    "getOfficialBudget",
    "calculateBudget",
    "draftEmail",
  ],
  suggestions: [
    "Redactá el correo con este presupuesto",
    "Pasalo a versión WhatsApp",
    "Respondé pidiendo la dirección y el horario de la visita",
  ],
};

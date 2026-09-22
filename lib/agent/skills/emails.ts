import type { AgentSkill } from "@/lib/agent/skills/types";

export const emailsSkill: AgentSkill = {
  id: "emails",
  label: "Emails",
  description: "Correos y mensajes de WhatsApp para clientes.",
  instructions: [
    "Habilidad activa: Emails.",
    "- Los correos y mensajes de WhatsApp para clientes se escriben con draftEmail, no en el chat. Después de la tool, comentá en una línea qué incluye el borrador.",
    "- Si el correo del cliente pide un presupuesto, sacá de él el servicio (frecuencia, visitas, horas por visita, empleadas y productos) y seguí los pasos de presupuesto nuevo antes de redactar: el precio sale de uno oficial vigente, de uno guardado igual o de un cálculo.",
    "- Si lo tuviste que calcular, redactá con ese precio y después proponé guardarlo con proposeCreateBudget, con los mismos changes y un nombre con el cliente y el servicio. Decí que queda pendiente de confirmar.",
    "- draftEmail solo acepta importes que salieron de una tool en esta conversación: el presupuesto (getBudget), uno guardado igual (findMatchingBudgets), un precio oficial vigente (searchOfficialBudgets o getOfficialBudget) o un cálculo (calculateBudget).",
    "- En el brief de draftEmail poné cliente, servicio, alcance, las opciones de precio que van y el tono. Si piden WhatsApp, usá channel whatsapp: más corto y sin formato.",
    "- Si draftEmail falla por un importe sin fuente o distinto, conseguilo con una tool y reintentá. Si falla por la nota de Literal E, pedí de nuevo el borrador aclarando que la nota es obligatoria.",
  ].join("\n"),
  tools: [
    "searchBudgets",
    "findMatchingBudgets",
    "getBudget",
    "searchOfficialBudgets",
    "getOfficialBudget",
    "calculateBudget",
    "draftEmail",
    "proposeCreateBudget",
  ],
  suggestions: [
    "Redactá el correo con este presupuesto",
    "Pasalo a versión WhatsApp",
    "Respondé pidiendo la dirección y el horario de la visita",
  ],
};

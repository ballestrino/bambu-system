import type { AgentSkill } from "@/lib/agent/skills/types";
import { AGENT_TOOL_NAMES } from "@/lib/agent/tool-catalog";

// Sin chip seleccionado: todas las tools y una sugerencia de cada habilidad.
export const generalSkill: AgentSkill = {
  id: "general",
  label: "General",
  description: "Sin habilidad fija: usa todas las herramientas.",
  instructions: [
    "Sin habilidad fija.",
    "- Elegí las tools según el pedido: presupuestos y cálculos, correos para clientes o números del negocio.",
    "- Los correos y mensajes para clientes se escriben con draftEmail, con importes que salieron de una tool. Si un correo pide un presupuesto, conseguí el precio con los pasos de presupuesto nuevo antes de redactar y, si lo calculaste, proponé guardarlo.",
    "- Guardar, crear, duplicar o publicar un presupuesto se propone con las tools propose*, con los mismos changes del cálculo: el usuario confirma en la tarjeta.",
  ].join("\n"),
  tools: AGENT_TOOL_NAMES,
  suggestions: [
    "Armá un presupuesto de limpieza de oficina, 2 veces por semana",
    "Redactá el correo con este presupuesto",
    "¿Cómo viene el mes?",
  ],
};

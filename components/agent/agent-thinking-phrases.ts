import { getStaticToolName, isStaticToolUIPart } from "ai";

import type { AgentUIMessage } from "@/components/agent/types";
import type { AgentSkillId } from "@/lib/agent/skills/types";
import { AGENT_TOOL_CATALOG, isAgentToolName, type AgentToolKind } from "@/lib/agent/tool-catalog";

// Lo que el agente está haciendo, dicho como acción.
export type ThinkingPhrase = string;

// "start": todavía no hay nada visible. "afterTools": las tools terminaron y
// el modelo lee sus resultados antes de seguir.
export type ThinkingPhase = "start" | "afterTools";

const START: Record<AgentSkillId, ThinkingPhrase[]> = {
  general: [
    "Pensando",
    "Leyendo tu mensaje",
    "Buscando en los datos",
    "Ordenando las ideas",
    "Armando la respuesta",
  ],
  presupuestos: [
    "Pensando",
    "Calculando las horas",
    "Buscando precios oficiales",
    "Calculando el margen",
    "Armando el presupuesto",
  ],
  emails: [
    "Pensando",
    "Leyendo los correos",
    "Buscando pedidos",
    "Redactando",
  ],
  consejos: [
    "Pensando",
    "Revisando los números del mes",
    "Comparando con meses anteriores",
    "Pensando un consejo",
  ],
  facturacion: [
    "Pensando",
    "Revisando las facturas",
    "Calculando los totales",
    "Armando el borrador",
  ],
  factura: [
    "Pensando",
    "Buscando el cliente",
    "Calculando el IVA",
    "Completando la factura",
  ],
};

const AFTER_TOOLS: Record<AgentToolKind, ThinkingPhrase[]> = {
  read: ["Leyendo los resultados", "Sacando conclusiones", "Escribiendo"],
  calc: ["Revisando los números", "Verificando el cálculo", "Escribiendo"],
  proposal: ["Preparando la propuesta", "Revisando los detalles"],
  draft: ["Revisando el borrador", "Puliendo el texto"],
};

const ORDER: AgentToolKind[] = ["proposal", "draft", "calc", "read"];

export function getThinkingPhrases(
  phase: ThinkingPhase,
  skill: AgentSkillId | undefined,
  kinds: AgentToolKind[]
): ThinkingPhrase[] {
  if (phase === "start") return START[skill ?? "general"] ?? START.general;
  const kind = ORDER.find((candidate) => kinds.includes(candidate)) ?? "read";
  return AFTER_TOOLS[kind];
}

const DONE_STATES = new Set(["output-available", "output-error", "output-denied"]);

// Las tools del último bloque visible si todas terminaron y no vino texto
// después: el modelo está leyendo los resultados. Si no, null.
export function getFinishedToolKinds(message: AgentUIMessage): AgentToolKind[] | null {
  const visible = message.parts.filter((part) =>
    part.type === "text" ? part.text.trim() !== "" : isStaticToolUIPart(part)
  );
  const trailing: AgentToolKind[] = [];
  for (let index = visible.length - 1; index >= 0; index--) {
    const part = visible[index];
    if (!isStaticToolUIPart(part)) break;
    if (!DONE_STATES.has(part.state)) return null;
    const name = getStaticToolName(part);
    trailing.push(isAgentToolName(name) ? AGENT_TOOL_CATALOG[name].kind : "read");
  }
  return trailing.length > 0 ? trailing : null;
}

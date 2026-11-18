import { getStaticToolName, isStaticToolUIPart } from "ai";

import type { AgentUIMessage } from "@/components/agent/types";
import type { AgentSkillId } from "@/lib/agent/skills/types";
import { AGENT_TOOL_CATALOG, isAgentToolName, type AgentToolKind } from "@/lib/agent/tool-catalog";

// Cada frase trae su ícono y su movimiento: pensar late, calcular tipea,
// buscar recorre, leer pasa la hoja y escribir va y viene.
export type ThinkingMotion = "think" | "calc" | "search" | "read" | "write";
export type ThinkingPhrase = { text: string; motion: ThinkingMotion };

// "start": todavía no hay nada visible. "afterTools": las tools terminaron y
// el modelo lee sus resultados antes de seguir.
export type ThinkingPhase = "start" | "afterTools";

const p = (text: string, motion: ThinkingMotion): ThinkingPhrase => ({ text, motion });

const START: Record<AgentSkillId, ThinkingPhrase[]> = {
  general: [
    p("Pensando", "think"),
    p("Leyendo tu mensaje", "read"),
    p("Buscando en los datos", "search"),
    p("Ordenando las ideas", "think"),
    p("Armando la respuesta", "write"),
  ],
  presupuestos: [
    p("Pensando", "think"),
    p("Calculando las horas", "calc"),
    p("Buscando precios oficiales", "search"),
    p("Calculando el margen", "calc"),
    p("Armando el presupuesto", "write"),
  ],
  emails: [
    p("Pensando", "think"),
    p("Leyendo los correos", "read"),
    p("Buscando pedidos", "search"),
    p("Redactando", "write"),
  ],
  consejos: [
    p("Pensando", "think"),
    p("Revisando los números del mes", "calc"),
    p("Comparando con meses anteriores", "search"),
    p("Pensando un consejo", "think"),
  ],
  facturacion: [
    p("Pensando", "think"),
    p("Revisando las facturas", "read"),
    p("Calculando los totales", "calc"),
    p("Armando el borrador", "write"),
  ],
  factura: [
    p("Pensando", "think"),
    p("Buscando el cliente", "search"),
    p("Calculando el IVA", "calc"),
    p("Completando la factura", "write"),
  ],
};

const AFTER_TOOLS: Record<AgentToolKind, ThinkingPhrase[]> = {
  read: [p("Leyendo los resultados", "read"), p("Sacando conclusiones", "think"), p("Escribiendo", "write")],
  calc: [p("Revisando los números", "calc"), p("Verificando el cálculo", "calc"), p("Escribiendo", "write")],
  proposal: [p("Preparando la propuesta", "write"), p("Revisando los detalles", "read")],
  draft: [p("Revisando el borrador", "read"), p("Puliendo el texto", "write")],
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

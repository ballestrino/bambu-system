import type { AgentToolName } from "@/lib/agent/tool-catalog";

export const AGENT_SKILL_IDS = ["general", "presupuestos", "emails", "consejos"] as const;

export type AgentSkillId = (typeof AGENT_SKILL_IDS)[number];

// Una habilidad es un archivo: instrucciones para el prompt, las tools que
// puede usar y las sugerencias del estado vacío. Agregar una es sumar un
// archivo y registrarlo en skills/index.ts.
export type AgentSkill = {
  id: AgentSkillId;
  label: string;
  description: string;
  instructions: string;
  tools: readonly AgentToolName[];
  suggestions: readonly string[];
};

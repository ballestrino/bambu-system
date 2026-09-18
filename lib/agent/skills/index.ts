import { consejosSkill } from "@/lib/agent/skills/consejos";
import { emailsSkill } from "@/lib/agent/skills/emails";
import { generalSkill } from "@/lib/agent/skills/general";
import { presupuestosSkill } from "@/lib/agent/skills/presupuestos";
import {
  AGENT_SKILL_IDS,
  type AgentSkill,
  type AgentSkillId,
} from "@/lib/agent/skills/types";
import type { AgentToolName } from "@/lib/agent/tool-catalog";

export { AGENT_SKILL_IDS, type AgentSkill, type AgentSkillId };

export const AGENT_SKILLS: Record<AgentSkillId, AgentSkill> = {
  general: generalSkill,
  presupuestos: presupuestosSkill,
  emails: emailsSkill,
  consejos: consejosSkill,
};

export const DEFAULT_AGENT_SKILL: AgentSkillId = "general";

export const isAgentSkillId = (value: unknown): value is AgentSkillId =>
  typeof value === "string" && (AGENT_SKILL_IDS as readonly string[]).includes(value);

export const getAgentSkill = (id: AgentSkillId) => AGENT_SKILLS[id];

// Las tools activas del turno. Todas quedan registradas en streamText (el
// historial puede traer tools de otra habilidad) y esta lista va en
// activeTools. getBusinessProfile está siempre.
export const resolveSkillToolNames = (skill: AgentSkill): AgentToolName[] => [
  ...new Set<AgentToolName>(["getBusinessProfile", ...skill.tools]),
];

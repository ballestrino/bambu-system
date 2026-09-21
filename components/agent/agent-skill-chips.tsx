import { AGENT_SKILLS, DEFAULT_AGENT_SKILL, type AgentSkillId } from "@/lib/agent/skills";
import { cn } from "@/lib/utils";

const CHIP_SKILLS = ["presupuestos", "emails", "consejos"] as const satisfies readonly AgentSkillId[];

// La habilidad viaja con cada mensaje. Los chips son un toggle: sin ninguno
// marcado el agente usa General (todas las tools).
export function AgentSkillChips({
  value,
  onChange,
}: {
  value: AgentSkillId;
  onChange: (skill: AgentSkillId) => void;
}) {
  return (
    <div role="group" aria-label="Habilidad del próximo mensaje" className="flex gap-2 overflow-x-auto">
      {CHIP_SKILLS.map((id) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            title={AGENT_SKILLS[id].description}
            onClick={() => onChange(active ? DEFAULT_AGENT_SKILL : id)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:min-h-8",
              active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent"
            )}
          >
            {AGENT_SKILLS[id].label}
          </button>
        );
      })}
    </div>
  );
}

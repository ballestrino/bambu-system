import { Sparkles } from "lucide-react";

import { AGENT_SKILLS, type AgentSkillId } from "@/lib/agent/skills";

// Estado vacío: qué puede hacer la habilidad activa y sus sugerencias, que se
// envían con un toque.
export function AgentEmptyState({
  skill,
  contextLabel,
  onSuggestion,
}: {
  skill: AgentSkillId;
  contextLabel: string;
  onSuggestion: (text: string) => void;
}) {
  const definition = AGENT_SKILLS[skill];
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 py-6 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium">¿En qué te ayudo?</p>
        <p className="text-sm text-muted-foreground">{definition.description}</p>
        <p className="text-xs text-muted-foreground">{contextLabel}</p>
      </div>
      <div className="flex w-full max-w-md flex-col gap-2">
        {definition.suggestions.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onSuggestion(suggestion)}
            className="min-h-11 rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

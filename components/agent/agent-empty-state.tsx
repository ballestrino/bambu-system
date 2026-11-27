import { AgentLogoTile } from "@/components/agent/agent-logo-tile";

// Un atajo del estado vacío: el botón dice `label` y le manda `prompt` al
// agente (Formularios web: "Arma la respuesta", "Pedir datos").
export type AgentQuickPrompt = { label: string; prompt: string };

// Estado vacío de una conversación nueva: el saludo, el contexto y, si la
// pantalla los da, los atajos.
export function AgentEmptyState({
  contextLabel,
  quickPrompts,
  onPick,
  disabled,
}: {
  contextLabel: string;
  quickPrompts?: AgentQuickPrompt[];
  onPick?: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3.5 px-4 py-8 text-center">
      <AgentLogoTile size="lg" />
      <div className="space-y-1">
        <p className="text-[17px] font-semibold tracking-tight">¿En qué te ayudo?</p>
        <p className="text-[13px] text-ops-text-muted">{contextLabel}</p>
      </div>
      {quickPrompts?.length && onPick ? (
        <div className="flex flex-wrap justify-center gap-2 pt-1">
          {quickPrompts.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={disabled}
              onClick={() => onPick(item.prompt)}
              className="h-9 rounded-full border border-ops-border bg-ops-surface px-3.5 text-[13px] font-medium text-ops-text transition-colors hover:bg-ops-surface-muted focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

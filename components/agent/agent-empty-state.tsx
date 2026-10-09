import { AgentLogoTile } from "@/components/agent/agent-logo-tile";

// Estado vacío de una conversación nueva: solo el saludo y el contexto.
export function AgentEmptyState({ contextLabel }: { contextLabel: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-3.5 px-4 py-8 text-center">
      <AgentLogoTile size="lg" />
      <div className="space-y-1">
        <p className="text-[17px] font-semibold tracking-tight">¿En qué te ayudo?</p>
        <p className="text-[13px] text-ops-text-muted">{contextLabel}</p>
      </div>
    </div>
  );
}

import { Sparkles } from "lucide-react";

// Estado vacío de una conversación nueva: solo el saludo y el contexto.
export function AgentEmptyState({ contextLabel }: { contextLabel: string }) {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 py-6 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="size-5" aria-hidden />
      </span>
      <div className="space-y-1">
        <p className="font-medium">¿En qué te ayudo?</p>
        <p className="text-xs text-muted-foreground">{contextLabel}</p>
      </div>
    </div>
  );
}

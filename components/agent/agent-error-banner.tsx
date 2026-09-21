import { AlertCircle, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

// Un turno que falló: el mensaje del servidor (o uno genérico) y Reintentar,
// que repite el último pedido.
export function AgentErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
      <p className="min-w-0 flex-1 break-words">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="h-11 shrink-0 sm:h-8" onClick={onRetry}>
          <RotateCcw aria-hidden />
          Reintentar
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="size-11 shrink-0 sm:size-8"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
      >
        <X aria-hidden />
      </Button>
    </div>
  );
}

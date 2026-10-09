import { AlertCircle, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";

// Un turno que falló: el mensaje del servidor (o uno genérico) y Reintentar,
// que repite el último pedido. Va sobre el composer, en el ancho de lectura.
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
    <div className="px-3 sm:px-6 @2xl/chat:px-8">
      <div
        role="alert"
        className="mx-auto mb-2 flex max-w-[720px] items-start gap-2.5 rounded-xl border border-red-300 bg-red-50 py-2.5 pr-2.5 pl-3 text-[13px] text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200"
      >
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <strong className="font-semibold">No se pudo responder</strong>
          <span className="leading-snug break-words text-red-900/90 dark:text-red-100/90">{message}</span>
        </div>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="h-11 shrink-0 rounded-[10px] border-red-300 bg-white font-semibold text-red-800 hover:bg-red-50 hover:text-red-900 sm:h-[34px] dark:border-red-500/40 dark:bg-transparent dark:text-red-200"
            onClick={onRetry}
          >
            <RotateCcw aria-hidden />
            Reintentar
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="size-11 shrink-0 rounded-[10px] text-red-800 hover:bg-red-100 hover:text-red-900 sm:size-[34px] dark:text-red-200 dark:hover:bg-red-500/20"
          onClick={onDismiss}
          aria-label="Cerrar aviso"
        >
          <X aria-hidden />
        </Button>
      </div>
    </div>
  );
}

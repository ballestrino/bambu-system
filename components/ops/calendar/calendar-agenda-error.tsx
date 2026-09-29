import { AlertCircle, RefreshCw } from "lucide-react";

import { OpsEmptyState } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CalendarAgendaErrorProps = {
  isRetrying: boolean;
  onRetry: () => void;
};

const RetryButton = ({
  isRetrying,
  onRetry,
  size,
}: CalendarAgendaErrorProps & { size?: "sm" }) => (
  <Button
    className={size ? undefined : "min-h-11"}
    disabled={isRetrying}
    onClick={onRetry}
    size={size}
    type="button"
    variant="outline"
  >
    <RefreshCw className={cn("h-4 w-4", isRetrying && "animate-spin")} />
    {isRetrying ? "Reintentando..." : "Reintentar"}
  </Button>
);

// The month never loaded: the day is unknown, not empty.
export const CalendarAgendaError = (props: CalendarAgendaErrorProps) => (
  <OpsEmptyState
    action={<RetryButton {...props} />}
    description="Revisa la conexión y vuelve a cargar las visitas del mes."
    icon={AlertCircle}
    title="No pudimos cargar la agenda"
  />
);

// A refresh failed over visits already on screen: keep them and say so.
export const CalendarAgendaStaleNotice = (props: CalendarAgendaErrorProps) => (
  <div
    className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm text-ops-text"
    role="alert"
  >
    No pudimos actualizar la agenda. Puede no estar al día.
    <RetryButton {...props} size="sm" />
  </div>
);

import { AlertCircle } from "lucide-react";

import { OpsEmptyState } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";

export const FinancialErrorState = ({
  onRetry,
}: {
  onRetry: () => Promise<unknown> | void;
}) => (
  <OpsEmptyState
    action={<Button onClick={() => void onRetry()}>Reintentar</Button>}
    description="El resto de Finanzas sigue disponible mientras vuelves a cargar esta sección."
    icon={AlertCircle}
    title="No pudimos cargar estos datos"
  />
);

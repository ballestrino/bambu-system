import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@prisma/client";
import { cn } from "@/lib/utils";
import {
  getOpsStatusConfig,
  opsPaymentStatus,
  opsToneClasses,
} from "@/components/ops/shared/ops-theme";

export const PaymentStatusBadge = ({ status }: { status: PaymentStatus }) => {
  const config = getOpsStatusConfig(opsPaymentStatus, status);

  return (
    <Badge variant="outline" className={cn("border", opsToneClasses[config.tone])}>
      {config.label}
    </Badge>
  );
};

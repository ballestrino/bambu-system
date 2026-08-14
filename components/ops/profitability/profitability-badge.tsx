import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ProfitabilitySeverity } from "@/lib/ops/profitability";
import { profitabilityStatus } from "@/components/ops/profitability/profitability-status";

export const ProfitabilityBadge = ({
  className,
  severity,
}: {
  className?: string;
  severity: ProfitabilitySeverity;
}) => {
  const status = profitabilityStatus[severity];
  const Icon = status.icon;
  return (
    <Badge className={cn("gap-1 border", status.className, className)} variant="outline">
      <Icon aria-hidden="true" />
      {status.label}
    </Badge>
  );
};

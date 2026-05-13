import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  opsSurface,
  opsToneClasses,
  type OpsTone,
} from "@/components/ops/shared/ops-theme";

export type OpsMetric = {
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: OpsTone;
};

type OpsMetricCardProps = OpsMetric & {
  className?: string;
};

export const OpsMetricCard = ({
  className,
  helper,
  icon: Icon,
  label,
  tone = "neutral",
  value,
}: OpsMetricCardProps) => (
  <div className={cn(opsSurface.panelSoft, "p-4", className)}>
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="text-2xl font-semibold tracking-tight text-[#18251D] dark:text-[#EAF5EC]">
          {value}
        </div>
      </div>
      {Icon ? (
        <div className={cn("rounded-md border p-2", opsToneClasses[tone])}>
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
    </div>
    {helper ? <div className="mt-3 text-sm text-muted-foreground">{helper}</div> : null}
  </div>
);

export const OpsMetricsGrid = ({
  className,
  metrics,
}: {
  className?: string;
  metrics: OpsMetric[];
}) => (
  <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-4", className)}>
    {metrics.map((metric) => (
      <OpsMetricCard key={metric.label} {...metric} />
    ))}
  </div>
);

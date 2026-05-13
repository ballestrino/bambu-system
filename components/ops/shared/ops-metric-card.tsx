import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  opsSurface,
  opsToneClasses,
  type OpsTone,
} from "@/components/ops/shared/ops-theme";

export type OpsMetric = {
  className?: string;
  label: string;
  value: ReactNode;
  helper?: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  size?: "compact" | "default";
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
  size = "default",
  tone = "neutral",
  value,
}: OpsMetricCardProps) => (
  <div
    className={cn(
      opsSurface.panelSoft,
      size === "compact" ? "p-3" : "p-4",
      className
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className={cn("min-w-0", size === "compact" ? "space-y-1.5" : "space-y-2")}>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div
          className={cn(
            "font-semibold tracking-tight text-[#18251D] dark:text-[#EAF5EC]",
            size === "compact" ? "text-xl" : "text-2xl"
          )}
        >
          {value}
        </div>
      </div>
      {Icon ? (
        <div
          className={cn(
            "rounded-md border",
            size === "compact" ? "p-1.5" : "p-2",
            opsToneClasses[tone]
          )}
        >
          <Icon className={cn(size === "compact" ? "h-3.5 w-3.5" : "h-4 w-4")} />
        </div>
      ) : null}
    </div>
    {helper ? (
      <div
        className={cn(
          "text-muted-foreground",
          size === "compact" ? "mt-2 text-xs" : "mt-3 text-sm"
        )}
      >
        {helper}
      </div>
    ) : null}
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

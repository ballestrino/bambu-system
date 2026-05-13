import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { opsSurface } from "@/components/ops/shared/ops-theme";

type OpsEmptyStateProps = {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  className?: string;
};

export const OpsEmptyState = ({
  action,
  className,
  description,
  icon: Icon,
  secondaryAction,
  title,
}: OpsEmptyStateProps) => (
  <div
    className={cn(
      opsSurface.panelSoft,
      "flex min-h-48 flex-col items-center justify-center gap-4 border-dashed p-6 text-center",
      className
    )}
  >
    {Icon ? (
      <div className="rounded-md border border-[#53985E]/20 bg-[#EAF5EC] p-3 text-[#244C2D] dark:bg-[#53985E]/15 dark:text-[#A7D8AE]">
        <Icon className="h-5 w-5" />
      </div>
    ) : null}
    <div className="max-w-md space-y-1">
      <h2 className="text-lg font-semibold text-[#18251D] dark:text-[#EAF5EC]">
        {title}
      </h2>
      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}
    </div>
    {action || secondaryAction ? (
      <div className="flex flex-wrap justify-center gap-2">
        {action}
        {secondaryAction}
      </div>
    ) : null}
  </div>
);

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const OpsDetailRow = ({
  actions,
  children,
  className,
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "flex flex-col gap-4 rounded-[var(--ops-radius-row)] bg-ops-surface-muted p-4",
      className
    )}
  >
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">{children}</div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  </div>
);

export const OpsDetailInset = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-[var(--ops-radius-row)] bg-ops-surface-muted/80 p-3",
      className
    )}
  >
    {children}
  </div>
);

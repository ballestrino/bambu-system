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
      "flex flex-col gap-4 rounded-2xl border border-[#53985E]/12 bg-[#F8FBF8] p-4 shadow-sm shadow-[#244C2D]/5 dark:bg-[#132016]",
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
      "rounded-2xl border border-[#53985E]/12 bg-[#F8FBF8]/80 p-3 dark:bg-[#132016]/80",
      className
    )}
  >
    {children}
  </div>
);

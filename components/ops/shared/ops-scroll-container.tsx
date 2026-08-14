import type { PropsWithChildren } from "react";

import { cn } from "@/lib/utils";

export const OpsScrollContainer = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div
    className={cn("max-h-[34rem] overflow-y-auto p-1 pr-3", className)}
    data-slot="ops-scroll-container"
  >
    {children}
  </div>
);

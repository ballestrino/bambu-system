import type { ReactNode } from "react";

import { opsToneClasses, type OpsTone } from "@/components/ops/shared/ops-theme";
import { cn } from "@/lib/utils";

const dotColors: Partial<Record<OpsTone, string>> = {
  success: "bg-emerald-600",
  warning: "bg-amber-600",
};

// Chip de 22 px del diseño de Facturación (tipo, motivo, estado ante DGI).
export const BillingChip = ({
  children,
  className,
  dot,
  tone = "neutral",
}: {
  children: ReactNode;
  className?: string;
  dot?: boolean;
  tone?: OpsTone;
}) => (
  <span
    className={cn(
      "inline-flex h-[22px] items-center gap-1.5 rounded-md border px-2 text-xs font-medium whitespace-nowrap",
      opsToneClasses[tone],
      className
    )}
  >
    {dot ? <span aria-hidden className={cn("size-1.5 rounded-full", dotColors[tone] ?? "bg-current")} /> : null}
    {children}
  </span>
);

"use client";

import { ChevronRight, CircleDollarSign } from "lucide-react";

import { useMonthlyAgentCost } from "@/components/agent/hooks/use-agent-queries";
import { formatUsd } from "@/lib/ai/pricing";
import { cn } from "@/lib/utils";

// "Costos de IA · US$ 0,11 este mes" al pie del historial: abre el informe.
// El total es el del equipo en el mes actual (el que decide el servidor). En
// la columna de escritorio va como pie; en el teléfono, como una fila más.
export function AgentMonthCostLink({ variant, onClick }: { variant: "footer" | "card"; onClick: () => void }) {
  const month = useMonthlyAgentCost(null, true);
  const cost = month.data;
  const label = cost
    ? `${formatUsd(cost.total.costUsd)}${cost.unpricedEvents > 0 ? " + sin precio" : ""} este mes`
    : null;
  const card = variant === "card";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
        card
          ? "min-h-11 rounded-[14px] bg-ops-surface px-3.5 py-3 text-sm active:bg-ops-surface-muted"
          : "border-t border-ops-border px-4.5 py-3 text-xs text-ops-text-muted hover:bg-ops-surface-muted/60"
      )}
    >
      <CircleDollarSign className={cn("shrink-0 text-ops-text-muted", card ? "size-[18px]" : "size-[15px]")} aria-hidden />
      <span className={cn("font-medium", card ? "font-normal" : "text-ops-text")}>Costos de IA</span>
      {label && (
        <span className={cn("ml-auto truncate text-ops-text-muted tabular-nums", card && "text-[13px]")}>{label}</span>
      )}
      {card && <ChevronRight className={cn("size-4 shrink-0 text-ops-text-muted/60", !label && "ml-auto")} aria-hidden />}
    </button>
  );
}

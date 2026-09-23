import { TrendingUp } from "lucide-react";
import Link from "next/link";

import { AgentCard, CardNote } from "@/components/agent/cards/agent-card";
import { formatMoney } from "@/components/agent/format";
import type { ProfitabilityCardData } from "@/components/agent/types";
import { profitabilityStatus } from "@/components/ops/profitability/profitability-status";
import type { ProfitabilityMissingData } from "@/lib/ops/profitability/types";
import { cn } from "@/lib/utils";

const MISSING_LABELS: Record<ProfitabilityMissingData, string> = {
  BUDGET_SNAPSHOT: "copia del presupuesto",
  EXPECTED_REVENUE: "ingreso esperado",
  EXPECTED_PROFIT: "ganancia esperada",
  PLANNED_VISITS: "visitas planificadas",
  EMPLOYEE_RATE: "tarifa de empleadas",
  REAL_TIMES: "horarios reales",
  VISIT_TEAM: "equipo de la visita",
};

// Rentabilidad por trabajo, con lo que falta para que el número sea
// confiable (missingData) a la vista.
export function AgentProfitabilityCard({ data }: { data: ProfitabilityCardData }) {
  const hidden = data.total - data.jobs.length;
  return (
    <AgentCard
      icon={TrendingUp}
      title={data.mode === "HISTORY" ? "Rentabilidad histórica" : `Rentabilidad de ${data.monthLabel}`}
      subtitle={`${data.total} ${data.total === 1 ? "trabajo" : "trabajos"}`}
    >
      <ul className="divide-y">
        {data.jobs.map((job) => {
          const status = profitabilityStatus[job.severity];
          return (
            <li key={job.jobId} className="space-y-1 py-2 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/dashboard/jobs/${job.jobId}`}
                  className="min-w-0 truncate font-medium underline-offset-4 hover:underline"
                >
                  {job.jobName}
                </Link>
                <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[11px]", status.className)}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs tabular-nums text-muted-foreground">
                Ganancia{" "}
                <span className={cn("font-medium text-foreground", job.actualProfit < 0 && "text-destructive")}>
                  {formatMoney(job.actualProfit)}
                </span>{" "}
                · costo {formatMoney(job.actualCost)} · cobrado {formatMoney(job.collectedRevenue)} de{" "}
                {formatMoney(job.expectedRevenue)} · {job.completedVisits}/{job.plannedVisits} visitas
              </p>
              {job.missingData.length > 0 && (
                <CardNote tone="warning">
                  Falta: {job.missingData.map((item) => MISSING_LABELS[item] ?? item).join(", ")}.
                </CardNote>
              )}
            </li>
          );
        })}
      </ul>
      {hidden > 0 && <CardNote>Y {hidden} trabajos más.</CardNote>}
    </AgentCard>
  );
}

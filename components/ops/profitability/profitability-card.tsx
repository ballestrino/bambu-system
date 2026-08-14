import Link from "next/link";
import { ArrowRight, Banknote, Gauge, ReceiptText } from "lucide-react";

import { ProfitabilityBadge } from "@/components/ops/profitability/profitability-badge";
import {
  formatProfitabilityMoney,
  profitabilityStatus,
} from "@/components/ops/profitability/profitability-status";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { JobProfitability } from "@/lib/ops/profitability";

const Metric = ({ icon: Icon, label, value }: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) => (
  <div className="min-w-0">
    <p className="flex items-center gap-1 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" /> {label}
    </p>
    <p className="truncate font-semibold">{value}</p>
  </div>
);

export const ProfitabilityCard = ({
  compact = false,
  result,
}: {
  compact?: boolean;
  result: JobProfitability;
}) => {
  const status = profitabilityStatus[result.severity];
  return (
    <article className={cn("rounded-xl border-l-4 bg-background p-4 shadow-sm ring-1 ring-black/5 dark:ring-white/10", status.className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <ProfitabilityBadge severity={result.severity} />
          <h3 className="truncate text-base font-semibold text-foreground">{result.jobName}</h3>
          <p className="text-xs text-muted-foreground">
            {result.completedVisits} de {result.plannedVisits} visitas · {result.progressPercent.toFixed(0)}% ejecutado
          </p>
        </div>
        <Button asChild className="shrink-0" size="sm" variant="outline">
          <Link href={`/dashboard/jobs/${result.jobId}`}>
            Detalle <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <div className={cn("mt-4 grid gap-3", compact ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-4")}>
        <Metric icon={Gauge} label="Ganancia esperada" value={formatProfitabilityMoney(result.expectedProfit)} />
        <Metric icon={Banknote} label="Resultado proyectado" value={formatProfitabilityMoney(result.actualProfit)} />
        {!compact ? <Metric icon={ReceiptText} label="Coste directo" value={formatProfitabilityMoney(result.actualCost)} /> : null}
        {!compact ? <Metric icon={Banknote} label="Cobrado" value={formatProfitabilityMoney(result.collectedRevenue)} /> : null}
      </div>
      {result.severity === "LOW_PROFIT" ? (
        <p className="mt-3 text-xs font-medium">La ganancia proyectada está {result.profitShortfallPercent.toFixed(1)}% por debajo de lo esperado.</p>
      ) : null}
      {result.missingData.length ? (
        <p className="mt-3 text-xs">Faltan {result.missingData.length} dato(s) para calcular el resultado con confianza.</p>
      ) : null}
    </article>
  );
};

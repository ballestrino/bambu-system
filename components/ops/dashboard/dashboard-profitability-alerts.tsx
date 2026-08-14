import Link from "next/link";
import { ArrowRight, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";

import { ProfitabilityCard } from "@/components/ops/profitability/profitability-card";
import { ProfitabilityLoading } from "@/components/ops/profitability/profitability-loading";
import { profitabilityNeedsAttention } from "@/components/ops/profitability/profitability-status";
import { OpsSection } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import type { JobProfitability } from "@/lib/ops/profitability";

export const DashboardProfitabilityAlerts = ({
  error,
  isLoading,
  onRetry,
  results,
}: {
  error: unknown;
  isLoading: boolean;
  onRetry: () => Promise<unknown> | void;
  results: JobProfitability[];
}) => {
  const alerts = results.filter((result) =>
    profitabilityNeedsAttention(result.severity)
  );

  if (isLoading) return <ProfitabilityLoading count={2} />;
  if (error) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
        <span className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> No pudimos revisar la rentabilidad.</span>
        <Button onClick={() => void onRetry()} size="sm" variant="outline"><RefreshCw /> Reintentar</Button>
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
        <CheckCircle2 className="h-5 w-5" />
        <span><strong>Rentabilidad en orden.</strong> No hay servicios calculables que requieran atención este mes.</span>
      </div>
    );
  }

  return (
    <OpsSection
      actions={
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/financial#rentabilidad">Ver todas <ArrowRight /></Link>
        </Button>
      }
      description={`${alerts.length} servicio(s) requieren revisión en el mes seleccionado.`}
      title="Alertas de rentabilidad"
    >
      <div className="grid gap-3 xl:grid-cols-3">
        {alerts.slice(0, 3).map((result) => (
          <ProfitabilityCard compact key={result.jobId} result={result} />
        ))}
      </div>
    </OpsSection>
  );
};

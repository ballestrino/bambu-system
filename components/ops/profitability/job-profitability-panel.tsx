"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarRange, Clock3, ReceiptText, RefreshCw, UsersRound, WalletCards } from "lucide-react";

import { useJobProfitability } from "@/components/ops/hooks/useJobProfitability";
import { ProfitabilityBadge } from "@/components/ops/profitability/profitability-badge";
import { ProfitabilityLoading } from "@/components/ops/profitability/profitability-loading";
import { formatProfitabilityMoney } from "@/components/ops/profitability/profitability-status";
import { OpsSection } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Breakdown = ({ icon: Icon, label, value }: {
  icon: typeof Clock3;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border border-black/5 bg-white/80 p-3 dark:border-white/10 dark:bg-background/60">
    <p className="flex items-center gap-1 text-xs text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</p>
    <p className="mt-1 font-semibold">{value}</p>
  </div>
);

export const JobProfitabilityPanel = ({ jobId, month }: { jobId: string; month: Date }) => {
  const [mode, setMode] = useState<"MONTH" | "HISTORY">("MONTH");
  const monthly = useJobProfitability({ jobId, mode: "MONTH", month }, mode === "MONTH");
  const history = useJobProfitability({ jobId, mode: "HISTORY", month }, mode === "HISTORY");
  const query = mode === "MONTH" ? monthly : history;
  const result = query.profitability[0];

  return (
    <OpsSection
      actions={
        <div className="flex rounded-md border bg-background p-1">
          <Button className={cn(mode === "MONTH" && "bg-[#EAF5EC] text-[#244C2D]")} onClick={() => setMode("MONTH")} size="sm" variant="ghost">Mes</Button>
          <Button className={cn(mode === "HISTORY" && "bg-[#EAF5EC] text-[#244C2D]")} onClick={() => setMode("HISTORY")} size="sm" variant="ghost">Histórico</Button>
        </div>
      }
      description="Rentabilidad operativa del presupuesto frente a horas, boletos y costes vinculados. El cobro no cambia la clasificación."
      title="Salud financiera del servicio"
    >
      {query.isLoading ? <ProfitabilityLoading count={1} /> : query.error ? (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <span>No pudimos calcular este servicio.</span>
          <Button onClick={() => void query.refetch()} size="sm" variant="outline"><RefreshCw /> Reintentar</Button>
        </div>
      ) : !result ? (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">Todavía no hay actividad financiera para este período.</div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl bg-[#F7FBF7] p-4 dark:bg-[#1A211A] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <ProfitabilityBadge severity={result.severity} />
              <p className="mt-2 text-2xl font-semibold">{formatProfitabilityMoney(result.actualProfit)}</p>
              <p className="text-sm text-muted-foreground">Resultado {mode === "MONTH" ? "del período" : "acumulado"} · objetivo {formatProfitabilityMoney(result.expectedProfit)}</p>
            </div>
            <div className="min-w-52">
              <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Progreso de visitas</span><span>{result.progressPercent.toFixed(0)}%</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10"><div className="h-full rounded-full bg-[#53985E]" style={{ width: `${Math.min(result.progressPercent, 100)}%` }} /></div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Breakdown icon={WalletCards} label="Ingreso esperado sin IVA" value={formatProfitabilityMoney(result.expectedRevenue)} />
            <Breakdown icon={Clock3} label="Horas reales" value={formatProfitabilityMoney(result.laborCost)} />
            <Breakdown icon={UsersRound} label="Boletos" value={formatProfitabilityMoney(result.transportationCost)} />
            <Breakdown icon={ReceiptText} label="Costes vinculados" value={formatProfitabilityMoney(result.operationalCost)} />
          </div>
          <div className="flex flex-col gap-3 rounded-lg border p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>Cobrado en el período: <strong>{formatProfitabilityMoney(result.collectedRevenue)}</strong>. Se informa aparte de la rentabilidad.</span>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="outline"><Link href="/dashboard/financial#costes"><ReceiptText /> Revisar costes</Link></Button>
              <Button asChild size="sm" variant="outline"><Link href="/dashboard/calendar"><CalendarRange /> Revisar visitas</Link></Button>
            </div>
          </div>
          {result.missingData.length ? <p className="text-sm text-amber-700 dark:text-amber-300">Hay {result.missingData.length} dato(s) faltante(s). Revisá el presupuesto, los horarios reales y las tarifas del equipo antes de tomar una decisión.</p> : null}
        </div>
      )}
    </OpsSection>
  );
};

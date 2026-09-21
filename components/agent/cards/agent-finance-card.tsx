import { LineChart, Wallet } from "lucide-react";
import Link from "next/link";

import { AgentCard, CardNote, CardRow } from "@/components/agent/cards/agent-card";
import { capitalizeFirst, formatMoney, formatPercent } from "@/components/agent/format";
import type { FinanceCardData, FinanceTrendCardData } from "@/components/agent/types";
import { cn } from "@/lib/utils";

const FINANCE_URL = "/dashboard/financial";

const OpenFinance = () => (
  <Link href={FINANCE_URL} className="shrink-0 text-xs text-primary underline-offset-4 hover:underline">
    Finanzas
  </Link>
);

function Hero({ label, value, tone }: { label: string; value: number; tone?: "result" }) {
  return (
    <div className="min-w-0 rounded-md bg-muted/40 px-2 py-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p
        className={cn(
          "truncate text-sm font-semibold tabular-nums",
          tone === "result" && value < 0 && "text-destructive"
        )}
      >
        {formatMoney(value)}
      </p>
    </div>
  );
}

// Las mismas cuentas que Finanzas y el tablero: cobrado, egresos y resultado.
export function AgentFinanceCard({ data }: { data: FinanceCardData }) {
  const { summary, counts } = data;
  return (
    <AgentCard icon={Wallet} title={`Finanzas de ${data.monthLabel}`} aside={<OpenFinance />}>
      <div className="grid grid-cols-3 gap-2">
        <Hero label="Cobrado" value={summary.recordedRevenue} />
        <Hero label="Egresos" value={summary.totalCosts} />
        <Hero label="Resultado" value={summary.realProfit} tone="result" />
      </div>
      <div className="space-y-0.5 text-xs">
        <CardRow label="Margen" value={formatPercent(summary.marginPercent)} />
        <CardRow label="Pagos a empleadas" value={formatMoney(summary.employeePaymentsTotal)} />
        <CardRow label="Costes" value={formatMoney(summary.manualCostsTotal)} />
        <CardRow label="BPS real / estimado" value={`${formatMoney(summary.realBpsTotal)} / ${formatMoney(summary.estimatedBpsTotal)}`} />
        <CardRow label="Ingreso proyectado" value={formatMoney(summary.projectedRevenue)} />
        <CardRow label="Ganancia proyectada" value={formatMoney(summary.projectedProfit)} />
      </div>
      <CardNote>
        {counts.clientPayments} cobros, {counts.employeePayments} pagos a empleadas y {counts.operationalCosts} costes registrados.
      </CardNote>
    </AgentCard>
  );
}

export function AgentFinanceTrendCard({ data }: { data: FinanceTrendCardData }) {
  return (
    <AgentCard icon={LineChart} title="Tendencia financiera" aside={<OpenFinance />}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-muted-foreground">
              <th className="py-1 text-left font-normal">Mes</th>
              <th className="py-1 text-right font-normal">Cobrado</th>
              <th className="py-1 text-right font-normal">Egresos</th>
              <th className="py-1 text-right font-normal">Resultado</th>
            </tr>
          </thead>
          <tbody>
            {data.points.map((point) => (
              <tr key={point.month}>
                <td className="py-0.5">{capitalizeFirst(point.monthLabel)}</td>
                <td className="py-0.5 text-right">{formatMoney(point.recordedRevenue)}</td>
                <td className="py-0.5 text-right">{formatMoney(point.totalCosts)}</td>
                <td className={cn("py-0.5 text-right font-medium", point.realProfit < 0 && "text-destructive")}>
                  {formatMoney(point.realProfit)}
                  <span className="block text-[10px] font-normal text-muted-foreground">
                    {formatPercent(point.marginPercent)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AgentCard>
  );
}

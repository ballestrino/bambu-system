import { Users } from "lucide-react";
import Link from "next/link";

import { AgentCard, CardNote, CardRow } from "@/components/agent/cards/agent-card";
import { formatHours, formatMoney } from "@/components/agent/format";
import type { PayrollCardData } from "@/components/agent/types";
import { cn } from "@/lib/utils";

const SHOWN_EMPLOYEES = 10;
const UNTRACKED = "Sin registro";

// Sueldos a mes vencido: los pagos del mes elegido contra las horas del
// anterior, igual que Finanzas → Pagos.
export function AgentPayrollCard({ data }: { data: PayrollCardData }) {
  const { summary } = data;
  const shown = data.employees.slice(0, SHOWN_EMPLOYEES);
  const hidden = data.total - shown.length;
  // Conversaciones guardadas antes del corte no traen tracked.
  const tracked = data.tracked !== false;
  const trackedMoney = (value: number | null) => (tracked ? formatMoney(value) : UNTRACKED);
  return (
    <AgentCard
      icon={Users}
      title={`Sueldos de ${data.paymentMonthLabel}`}
      subtitle={`Horas realizadas en ${data.workMonthLabel}`}
      aside={
        <Link href="/dashboard/payroll" className="shrink-0 text-xs text-primary underline-offset-4 hover:underline">
          Pagos
        </Link>
      }
    >
      <div className="space-y-0.5 text-xs">
        <CardRow label="Sugerido" value={trackedMoney(summary.suggestedTotal)} />
        <CardRow label={`Pagado (${summary.recordedCount})`} value={formatMoney(summary.recordedTotal)} />
        <CardRow label="Saldo" value={trackedMoney(summary.balanceTotal)} strong />
        <CardRow label="Aguinaldo generado" value={formatMoney(summary.aguinaldoGeneratedTotal)} />
        <CardRow label="Salario vacacional generado" value={formatMoney(summary.vacationSalaryGeneratedTotal)} />
        <CardRow label="BPS generado" value={formatMoney(summary.bpsGeneratedTotal)} />
      </div>
      {shown.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-1 text-left font-normal">Empleada</th>
                <th className="py-1 text-right font-normal">Horas</th>
                <th className="py-1 text-right font-normal">Sugerido</th>
                <th className="py-1 text-right font-normal">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.employeeId}>
                  <td className="max-w-32 truncate py-0.5">{row.employeeName}</td>
                  <td className="py-0.5 text-right">{formatHours(row.hours)}</td>
                  <td className="py-0.5 text-right">
                    {!tracked ? UNTRACKED : row.suggestedAmount === null ? "Sin tarifa" : formatMoney(row.suggestedAmount)}
                  </td>
                  <td className={cn("py-0.5 text-right", (row.balance ?? 0) < 0 && "text-destructive")}>
                    {trackedMoney(row.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {hidden > 0 && <CardNote>Y {hidden} empleadas más.</CardNote>}
      {!tracked && (
        <CardNote>Los sueldos se registran desde las horas de {data.trackingStartLabel}.</CardNote>
      )}
    </AgentCard>
  );
}

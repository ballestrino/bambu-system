import Link from "next/link";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { getSummaryPeriodHref } from "@/components/ops/employees/employee-summary-utils";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";
import type { OpsEmployee } from "@/components/ops/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PayrollRow = {
  aguinaldoGenerated: number | null;
  balance: number | null;
  bpsGenerated: number | null;
  employerBpsGenerated: number | null;
  employeeId: string;
  employeeName: string;
  hours: number;
  hourlyRate: number | null;
  personalBpsGenerated: number | null;
  recordedTotal: number;
  suggestedAmount: number | null;
  transportationAmount: number;
  visits: number;
};

const PayrollRowMetric = ({
  helper,
  label,
  value,
}: {
  helper?: string;
  label: string;
  value: string;
}) => (
  <div className="min-w-0 rounded-lg bg-black/[0.025] p-3 dark:bg-white/[0.035]">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
    <p className="mt-1 font-semibold tabular-nums">{value}</p>
    {helper ? <p className="mt-1 text-xs text-muted-foreground">{helper}</p> : null}
  </div>
);

const formatNullableMoney = (value: number | null) =>
  value === null ? "-" : formatPayrollMoney(value);

export const PayrollRowsPanel = ({
  employees,
  periodEnd,
  periodStart,
  rows,
}: {
  employees: OpsEmployee[];
  periodEnd: string;
  periodStart: string;
  rows: PayrollRow[];
}) => (
  <Card className="w-full border-0 bg-white/80 shadow-sm ring-1 ring-black/5 dark:bg-[#1A211A] dark:ring-white/10">
    <CardHeader><CardTitle>Resumen por empleado</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {rows.length ? (
        rows.map((row) => (
          <article key={row.employeeId} className="w-full rounded-xl border border-black/5 bg-white p-4 dark:border-white/10 dark:bg-[#242D23]">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="font-semibold">{row.employeeName}</p>
                <p className="text-sm text-muted-foreground">
                  {row.hours.toFixed(2)} hs · {row.visits} {row.visits === 1 ? "visita" : "visitas"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                  <Link href={`/dashboard/employees/${row.employeeId}`}>Detalle</Link>
                </Button>
                <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                  <Link href={getSummaryPeriodHref(row.employeeId, periodStart, periodEnd)}>
                    Resumen de empleado
                  </Link>
                </Button>
                <PayrollDialog
                  employeeId={row.employeeId}
                  employees={employees}
                  periodEnd={periodEnd}
                  periodStart={periodStart}
                  suggestedAmount={row.balance && row.balance > 0 ? row.balance : row.suggestedAmount}
                />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              <PayrollRowMetric label="Tarifa" value={formatNullableMoney(row.hourlyRate)} />
              <PayrollRowMetric label="Boleto" value={formatPayrollMoney(row.transportationAmount)} />
              <PayrollRowMetric label="Sugerido" value={formatNullableMoney(row.suggestedAmount)} />
              <PayrollRowMetric label="Pagos registrados" value={formatPayrollMoney(row.recordedTotal)} />
              <PayrollRowMetric label="Saldo" value={formatNullableMoney(row.balance)} />
              <PayrollRowMetric label="Aguinaldo generado" value={formatNullableMoney(row.aguinaldoGenerated)} />
              <PayrollRowMetric
                helper={row.bpsGenerated === null
                  ? undefined
                  : `Personal base ${formatNullableMoney(row.personalBpsGenerated)} · Patronal ${formatNullableMoney(row.employerBpsGenerated)}`}
                label="BPS generado base"
                value={formatNullableMoney(row.bpsGenerated)}
              />
            </div>
          </article>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay horas reales ni pagos registrados para este periodo.
        </p>
      )}
    </CardContent>
  </Card>
);

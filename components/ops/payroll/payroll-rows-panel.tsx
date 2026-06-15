import Link from "next/link";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { getSummaryPeriodHref } from "@/components/ops/employees/employee-summary-utils";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { formatPayrollMoney } from "@/components/ops/payroll/payroll-utils";
import type { OpsEmployee } from "@/components/ops/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type PayrollRow = {
  balance: number | null;
  employeeId: string;
  employeeName: string;
  hours: number;
  hourlyRate: number | null;
  recordedTotal: number;
  suggestedAmount: number | null;
  transportationAmount: number;
  visits: number;
};

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
  <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5 dark:bg-[#132016] dark:ring-white/10">
    <CardHeader><CardTitle>Resumen por empleado</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {rows.length ? (
        rows.map((row) => (
          <div key={row.employeeId} className="flex flex-col gap-3 rounded-lg border border-black/5 bg-white p-4 xl:flex-row xl:items-center xl:justify-between dark:border-white/10 dark:bg-[#1B2A1E]">
            <div className="grid gap-2 text-sm md:grid-cols-5">
              <div>
                <p className="font-medium">{row.employeeName}</p>
                <p className="text-muted-foreground">
                  {row.hours.toFixed(2)} hs · {row.visits}{" "}
                  {row.visits === 1 ? "visita" : "visitas"}
                </p>
              </div>
              <p>Tarifa: {row.hourlyRate === null ? "-" : formatPayrollMoney(row.hourlyRate)}</p>
              <p>Boleto: {formatPayrollMoney(row.transportationAmount)}</p>
              <p>Sugerido: {row.suggestedAmount === null ? "-" : formatPayrollMoney(row.suggestedAmount)}</p>
              <p>Saldo: {row.balance === null ? "-" : formatPayrollMoney(row.balance)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
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
        ))
      ) : (
        <p className="text-sm text-muted-foreground">
          No hay horas reales ni pagos registrados para este periodo.
        </p>
      )}
    </CardContent>
  </Card>
);

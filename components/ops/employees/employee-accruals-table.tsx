import Link from "next/link";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import type { EmployeeAccrualRow } from "@/components/ops/employees/employee-accruals-utils";
import { formatHours, formatMoney } from "@/components/ops/employees/employee-payroll";
import { OpsSection } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";

const accrualColumns = "grid-cols-[1.4fr_0.7fr_0.9fr_0.9fr_0.9fr_auto]";

const formatNullableMoney = (value: number | null) =>
  value === null ? "Sin tarifa" : formatMoney(value);

export const EmployeeAccrualsTable = ({
  rows,
  totals,
}: {
  rows: EmployeeAccrualRow[];
  totals: {
    aguinaldoTotal: number;
    grandTotal: number;
    hoursTotal: number;
    vacationSalaryTotal: number;
  };
}) => (
  <OpsSection
    description="Devengado por cada empleada en el periodo, con el total acumulado de todo el equipo."
    title="Acumulado por empleada"
  >
    {rows.length ? (
      <div className="overflow-x-auto">
        <div className="min-w-[44rem] overflow-hidden rounded-md border border-[#53985E]/15">
          <div
            className={`grid ${accrualColumns} gap-3 bg-[#EAF5EC] p-3 text-xs font-semibold uppercase tracking-wide text-[#244C2D] dark:bg-[#2B3629] dark:text-[#D4E3B8]`}
          >
            <span>Empleada</span>
            <span>Horas</span>
            <span>Aguinaldo</span>
            <span>Salario vacacional</span>
            <span>Total</span>
            <span className="sr-only">Acciones</span>
          </div>
          {rows.map((row) => (
            <div
              key={row.employeeId}
              className={`grid ${accrualColumns} items-center gap-3 border-t border-[#53985E]/10 bg-white p-3 text-sm dark:bg-background/80`}
            >
              <span className="min-w-0 truncate font-medium">{row.employeeName}</span>
              <span className="tabular-nums">{formatHours(row.hours)} hs</span>
              <span className="tabular-nums">
                {formatNullableMoney(row.aguinaldoGenerated)}
              </span>
              <span className="tabular-nums">
                {formatNullableMoney(row.vacationSalaryGenerated)}
              </span>
              <span className="font-semibold tabular-nums">
                {formatNullableMoney(row.totalGenerated)}
              </span>
              <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
                <Link href={`/dashboard/employees/${row.employeeId}`}>Detalle</Link>
              </Button>
            </div>
          ))}
          <div
            className={`grid ${accrualColumns} gap-3 border-t border-[#53985E]/20 bg-[#EAF5EC]/60 p-3 text-sm font-semibold dark:bg-[#2B3629]/60`}
          >
            <span>Total del equipo</span>
            <span className="tabular-nums">{formatHours(totals.hoursTotal)} hs</span>
            <span className="tabular-nums">{formatMoney(totals.aguinaldoTotal)}</span>
            <span className="tabular-nums">
              {formatMoney(totals.vacationSalaryTotal)}
            </span>
            <span className="tabular-nums">{formatMoney(totals.grandTotal)}</span>
            <span />
          </div>
        </div>
      </div>
    ) : (
      <p className="rounded-md border border-dashed border-black/10 bg-white p-5 text-sm text-muted-foreground dark:bg-background/80">
        No hay visitas realizadas en este periodo, asi que todavia no hay
        aguinaldo ni salario vacacional generado.
      </p>
    )}
  </OpsSection>
);

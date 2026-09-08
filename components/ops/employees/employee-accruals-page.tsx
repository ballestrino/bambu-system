"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock3, Gift, Palmtree, Wallet } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { EmployeeAccrualsTable } from "@/components/ops/employees/employee-accruals-table";
import {
  buildEmployeeAccrualRows,
  getAguinaldoPeriodRange,
  getEmployeeAccrualTotals,
  getInitialEmployeeAccrualsRange,
  getYearRange,
} from "@/components/ops/employees/employee-accruals-utils";
import { formatHours, formatMoney } from "@/components/ops/employees/employee-payroll";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import {
  OpsDateFilterInput,
  OpsFilterField,
  OpsMetricsGrid,
  OpsPageHeader,
  OpsPageShell,
  OpsToolbar,
} from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { toDateInputValue } from "@/components/ops/utils";

const toRangeFilter = (value: string, boundary: "end" | "start") =>
  value
    ? new Date(`${value}T${boundary === "start" ? "00:00:00" : "23:59:59"}`)
    : undefined;

export const EmployeeAccrualsPage = ({
  initialEndDate,
  initialStartDate,
}: {
  initialEndDate?: string;
  initialStartDate?: string;
}) => {
  const router = useRouter();
  const initialRange = getInitialEmployeeAccrualsRange(initialStartDate, initialEndDate);
  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);

  const { employees, isFetching: areEmployeesFetching } = useEmployees({
    includeArchived: true,
  });
  const { occurrences, isFetching: areOccurrencesFetching, isLoading } =
    useJobOccurrences(
      {
        endDate: toRangeFilter(endDate, "end"),
        includeArchived: false,
        startDate: toRangeFilter(startDate, "start"),
        statuses: ["DONE"],
      },
      `employee-accruals-${startDate}-${endDate}`
    );

  const rows = useMemo(
    () => buildEmployeeAccrualRows(employees, occurrences),
    [employees, occurrences]
  );
  const totals = getEmployeeAccrualTotals(rows);
  const isRefreshing = areEmployeesFetching || areOccurrencesFetching;

  const updateRange = (nextStart: string, nextEnd: string) => {
    setStartDate(nextStart);
    setEndDate(nextEnd);
    const params = new URLSearchParams();
    if (nextStart) params.set("start", nextStart);
    if (nextEnd) params.set("end", nextEnd);
    router.replace(`/dashboard/employees/accruals?${params.toString()}`);
  };

  const applyPreset = (range: { end: Date; start: Date }) => {
    updateRange(toDateInputValue(range.start), toDateInputValue(range.end));
  };

  return (
    <OpsPageShell>
      <OpsPageHeader
        actions={
          <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
            <Link href="/dashboard/employees">Empleados</Link>
          </Button>
        }
        description="Aguinaldo y salario vacacional generados por las horas trabajadas en el periodo, por empleada y en total."
        eyebrow="Empleadas"
        title="Aguinaldo y salario vacacional"
      />

      <OpsToolbar
        summary={
          isRefreshing
            ? "Actualizando..."
            : `${rows.length} empleada(s) con horas en el periodo`
        }
      >
        <OpsFilterField label="Desde">
          <OpsDateFilterInput
            value={startDate}
            onChange={(event) => updateRange(event.target.value, endDate)}
          />
        </OpsFilterField>
        <OpsFilterField label="Hasta">
          <OpsDateFilterInput
            value={endDate}
            onChange={(event) => updateRange(startDate, event.target.value)}
          />
        </OpsFilterField>
        <OpsFilterField label="Periodos">
          <div className="flex flex-wrap gap-2">
            <Button
              className={dashboardSecondaryActionClass}
              onClick={() => applyPreset(getYearRange(new Date()))}
              size="sm"
              type="button"
              variant="outline"
            >
              Año actual
            </Button>
            <Button
              className={dashboardSecondaryActionClass}
              onClick={() => applyPreset(getAguinaldoPeriodRange(new Date()))}
              size="sm"
              type="button"
              variant="outline"
            >
              Semestre de aguinaldo
            </Button>
          </div>
        </OpsFilterField>
      </OpsToolbar>

      <OpsMetricsGrid
        metrics={[
          {
            helper: "1/12 del importe por horas",
            icon: Gift,
            label: "Aguinaldo acumulado",
            tone: "active",
            value: formatMoney(totals.aguinaldoTotal),
          },
          {
            helper: "1/12 de licencia menos 18,10% personal",
            icon: Palmtree,
            label: "Salario vacacional acumulado",
            tone: "active",
            value: formatMoney(totals.vacationSalaryTotal),
          },
          {
            helper: "aguinaldo + salario vacacional de todo el equipo",
            icon: Wallet,
            label: "Total acumulado",
            tone: "money",
            value: formatMoney(totals.grandTotal),
          },
          {
            helper: totals.employeesWithoutRate
              ? `${totals.employeesWithoutRate} empleada(s) sin tarifa horaria`
              : "horas reales completadas",
            icon: Clock3,
            label: "Horas del periodo",
            tone: totals.employeesWithoutRate ? "warning" : "neutral",
            value: `${formatHours(totals.hoursTotal)} hs`,
          },
        ]}
      />

      {isLoading ? (
        <div className="w-full animate-pulse rounded-lg bg-muted/40 p-20" />
      ) : (
        <EmployeeAccrualsTable rows={rows} totals={totals} />
      )}
    </OpsPageShell>
  );
};

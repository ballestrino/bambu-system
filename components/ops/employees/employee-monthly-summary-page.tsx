"use client";

import { useEffect, useMemo } from "react";
import {
  AlertCircle,
  BadgeDollarSign,
  Bus,
  CalendarDays,
  Clock3,
  Download,
  WalletCards,
} from "lucide-react";

import {
  downloadEmployeeSummaryCsv,
  downloadEmployeeSummaryPdf,
} from "@/components/ops/employees/employee-summary-downloads";
import { EmployeeSummaryChart } from "@/components/ops/employees/employee-summary-chart";
import { EmployeeSummaryTable } from "@/components/ops/employees/employee-summary-table";
import {
  buildEmployeeMonthlySummary,
  getSummaryPeriodHref,
} from "@/components/ops/employees/employee-summary-utils";
import { formatHours, formatMoney } from "@/components/ops/employees/employee-payroll";
import { useEmployee } from "@/components/ops/hooks/useEmployee";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import {
  OpsBackButton,
  OpsDateFilterInput,
  OpsFilterField,
  OpsMetricsGrid,
  OpsPageHeader,
  OpsPageShell,
  OpsToolbar,
  useOpsMonthDateRange,
} from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const toRangeFilter = (value: string, boundary: "end" | "start") =>
  value ? new Date(`${value}T${boundary === "start" ? "00:00:00" : "23:59:59"}`) : undefined;

export const EmployeeMonthlySummaryPage = ({
  employeeId,
  initialEndDate,
  initialStartDate,
}: {
  employeeId: string;
  initialEndDate?: string;
  initialStartDate?: string;
}) => {
  // El período sigue al selector global de mes; un link de sueldos trae el suyo.
  const { endDate, setRange, startDate } = useOpsMonthDateRange({
    end: initialEndDate,
    start: initialStartDate,
  });
  const rangeFilters = {
    endDate: toRangeFilter(endDate, "end"),
    startDate: toRangeFilter(startDate, "start"),
  };

  const { employee, error, isLoading } = useEmployee(employeeId);
  const { occurrences, isFetching: areOccurrencesFetching } = useJobOccurrences(
    { employeeId, ...rangeFilters, includeArchived: false, statuses: ["DONE"] },
    `employee-summary-occurrences-${employeeId}-${startDate}-${endDate}`
  );
  const { payments, isFetching: arePaymentsFetching } = useEmployeePayments(
    { employeeId, ...rangeFilters, basis: "PERIOD" },
    `employee-summary-payments-${employeeId}-${startDate}-${endDate}`
  );

  const summary = useMemo(
    () => (employee ? buildEmployeeMonthlySummary(employee, occurrences, payments) : null),
    [employee, occurrences, payments]
  );
  const isRefreshing = areOccurrencesFetching || arePaymentsFetching;

  // replaceState deja el período en la URL sin volver a pedir la página al servidor.
  useEffect(() => {
    window.history.replaceState(null, "", getSummaryPeriodHref(employeeId, startDate, endDate));
  }, [employeeId, endDate, startDate]);
  const updateRange = (nextStart: string, nextEnd: string) => setRange(nextStart, nextEnd);

  const exportCsv = () => {
    if (!employee || !summary) return;

    downloadEmployeeSummaryCsv(employee.name, startDate, endDate, summary);
  };

  const exportPdf = () => {
    if (!employee || !summary) return;

    downloadEmployeeSummaryPdf(employee.name, startDate, endDate, summary);
  };

  if (isLoading) {
    return <div className="container w-full animate-pulse rounded-lg bg-muted/40 p-20" />;
  }

  if (error || !employee || !summary) {
    return (
      <Card className="container w-full border-dashed">
        <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">No pudimos cargar el resumen</h1>
        </CardContent>
      </Card>
    );
  }

  return (
    <OpsPageShell className="print:container print:max-w-none print:bg-white">
      <OpsBackButton fallbackHref={`/dashboard/employees/${employeeId}`} />
      <OpsPageHeader
        actions={
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button size="sm" onClick={exportPdf}>
              <Download className="h-4 w-4" />
              PDF
            </Button>
          </div>
        }
        description="Resumen mensual de horas, trabajos y pago sugerido para exportar o entregar."
        eyebrow="Empleadas"
        title={`Resumen de ${employee.name}`}
      />

      <OpsToolbar className="print:hidden" summary={isRefreshing ? "Actualizando..." : "Periodo visible"}>
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
      </OpsToolbar>

      <OpsMetricsGrid
        className="grid-cols-2 xl:grid-cols-4"
        metrics={[
          { helper: "reales completadas", icon: Clock3, label: "Horas", tone: "active", value: `${formatHours(summary.hours)} hs` },
          { helper: "visitas realizadas", icon: CalendarDays, label: "Visitas", tone: "success", value: summary.visits },
          {
            helper: "total por visitas",
            icon: Bus,
            label: "Boleto",
            tone: "warning",
            value: formatMoney(summary.transportationAmount),
          },
          {
            helper: summary.hourlyRate === null ? "falta tarifa horaria" : "horas + boleto",
            icon: BadgeDollarSign,
            label: "Pago sugerido",
            tone: summary.hourlyRate === null ? "archived" : "money",
            value: summary.paymentAmount === null ? "Sin tarifa" : formatMoney(summary.paymentAmount),
          },
          { helper: "pagos no anulados", icon: WalletCards, label: "Pagado", tone: "money", value: formatMoney(summary.recordedTotal) },
          { helper: "pagos anulados", icon: WalletCards, label: "Anulado", tone: "archived", value: formatMoney(summary.voidedTotal) },
          {
            helper: "sugerido menos pagado",
            icon: BadgeDollarSign,
            label: "Saldo",
            tone: summary.balance === null ? "archived" : summary.balance > 0 ? "warning" : "success",
            value: summary.balance === null ? "Sin tarifa" : formatMoney(summary.balance),
          },
          {
            helper: summary.hourlyRate === null ? "pendiente" : "base de calculo",
            icon: Clock3,
            label: "Tarifa",
            tone: summary.hourlyRate === null ? "archived" : "active",
            value: summary.hourlyRate === null ? "Sin tarifa" : `${formatMoney(summary.hourlyRate)} / h`,
          },
        ]}
      />

      <EmployeeSummaryChart
        rows={summary.jobRows}
        transportationAmount={summary.transportationAmount}
        visits={summary.visits}
      />
      <EmployeeSummaryTable rows={summary.jobRows} />
    </OpsPageShell>
  );
};

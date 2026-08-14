"use client";

import { useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { PaymentStatus } from "@prisma/client";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { useEmployeePaymentMutations } from "@/components/ops/hooks/useEmployeePaymentMutations";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { EmployeePaymentList } from "@/components/ops/payroll/employee-payment-list";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { PayrollFilters } from "@/components/ops/payroll/payroll-filters";
import { PayrollRowsPanel } from "@/components/ops/payroll/payroll-rows-panel";
import { PayrollSummary } from "@/components/ops/payroll/payroll-summary";
import { buildPayrollRows, getPayrollSummary } from "@/components/ops/payroll/payroll-utils";
import { useOpsSelectedMonth } from "@/components/ops/shared";
import { formatMonth, toDateInputValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";

export const PayrollPage = () => {
  const {
    goToPreviousMonth,
    month,
    monthKey,
    monthRange,
    resetToCurrentMonth,
  } = useOpsSelectedMonth();
  const [status, setStatus] = useState("RECORDED");
  const [employeeId, setEmployeeId] = useState("ALL");
  const startDate = toDateInputValue(monthRange.start);
  const endDate = toDateInputValue(monthRange.end);
  const monthLabel = formatMonth(month);

  const rangeFilters = {
    startDate: monthRange.start,
    endDate: monthRange.end,
  };
  const selectedEmployeeId = employeeId === "ALL" ? undefined : employeeId;

  const {
    employees,
    isFetching: areEmployeesFetching,
    refetch: refetchEmployees,
  } = useEmployees({ includeArchived: true });
  const visibleEmployees = selectedEmployeeId
    ? employees.filter((employee) => employee.id === selectedEmployeeId)
    : employees;
  const {
    payments,
    isFetching: arePaymentsFetching,
    isLoading,
    refetch: refetchPayments,
  } = useEmployeePayments(
    {
      assignedMonth: month,
      employeeId: selectedEmployeeId,
      statuses: status === "ALL" ? undefined : [status as PaymentStatus],
    },
    `payroll-${employeeId}-${monthKey}-${status}`
  );
  const {
    occurrences,
    isFetching: areOccurrencesFetching,
    refetch: refetchOccurrences,
  } = useJobOccurrences(
    {
      employeeId: selectedEmployeeId,
      ...rangeFilters,
      includeArchived: false,
      statuses: ["DONE"],
    },
    `payroll-occurrences-${employeeId}-${monthKey}`
  );
  const { voidPaymentAsync } = useEmployeePaymentMutations();

  const rows = useMemo(
    () => buildPayrollRows(visibleEmployees, occurrences, payments),
    [occurrences, payments, visibleEmployees]
  );
  const summary = getPayrollSummary(rows, payments);
  const isRefreshing =
    areEmployeesFetching || areOccurrencesFetching || arePaymentsFetching;
  const refreshPayrollData = async () => {
    await Promise.all([refetchEmployees(), refetchOccurrences(), refetchPayments()]);
  };
  const clearFilters = () => {
    resetToCurrentMonth();
    setStatus("RECORDED");
    setEmployeeId("ALL");
  };

  return (
    <div className="container flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground">Pagos a empleadas por periodo trabajado.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className={dashboardSecondaryActionClass}
            onClick={goToPreviousMonth}
            size="sm"
            type="button"
            variant="outline"
          >
            <ChevronLeft className="h-4 w-4" />
            Mes anterior
          </Button>
          <PayrollDialog
            employees={employees}
            periodEnd={endDate}
            periodStart={startDate}
          />
        </div>
      </div>
      <PayrollFilters
        employeeId={employeeId}
        employees={employees}
        isRefreshing={isRefreshing}
        monthLabel={monthLabel}
        onClear={clearFilters}
        onEmployeeIdChange={setEmployeeId}
        onRefresh={refreshPayrollData}
        onStatusChange={setStatus}
        status={status}
      />
      <PayrollSummary {...summary} showVoided={status !== "RECORDED"} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.75fr)]">
        <PayrollRowsPanel
          employees={employees}
          periodEnd={endDate}
          periodStart={startDate}
          rows={rows}
        />
        <EmployeePaymentList
          employees={employees}
          isLoading={isLoading}
          payments={payments}
          onVoid={async (paymentId) => {
            await voidPaymentAsync(paymentId);
          }}
        />
      </div>
    </div>
  );
};

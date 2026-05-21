"use client";

import { useMemo, useState } from "react";
import type { PaymentStatus } from "@prisma/client";

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
import { getMonthRange, toDateInputValue } from "@/components/ops/utils";

export const PayrollPage = () => {
  const currentMonth = getMonthRange(new Date());
  const [startDate, setStartDate] = useState(toDateInputValue(currentMonth.start));
  const [endDate, setEndDate] = useState(toDateInputValue(currentMonth.end));
  const [status, setStatus] = useState("ALL");
  const [employeeId, setEmployeeId] = useState("ALL");

  const rangeFilters = {
    startDate: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
    endDate: endDate ? new Date(`${endDate}T23:59:59`) : undefined,
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
      employeeId: selectedEmployeeId,
      ...rangeFilters,
      statuses: status === "ALL" ? undefined : [status as PaymentStatus],
    },
    `payroll-${employeeId}-${startDate}-${endDate}-${status}`
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
    `payroll-occurrences-${employeeId}-${startDate}-${endDate}`
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
    const nextMonth = getMonthRange(new Date());
    setStartDate(toDateInputValue(nextMonth.start));
    setEndDate(toDateInputValue(nextMonth.end));
    setStatus("ALL");
    setEmployeeId("ALL");
  };

  return (
    <div className="container flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground">Pagos a empleadas por periodo trabajado.</p>
        </div>
        <PayrollDialog
          employees={employees}
          periodEnd={endDate}
          periodStart={startDate}
        />
      </div>
      <PayrollFilters
        employeeId={employeeId}
        employees={employees}
        endDate={endDate}
        isRefreshing={isRefreshing}
        onClear={clearFilters}
        onEmployeeIdChange={setEmployeeId}
        onEndDateChange={setEndDate}
        onRefresh={refreshPayrollData}
        onStartDateChange={setStartDate}
        onStatusChange={setStatus}
        startDate={startDate}
        status={status}
      />
      <PayrollSummary {...summary} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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

"use client";

import { useMemo } from "react";

import { useEmployeePaymentMutations } from "@/components/ops/hooks/useEmployeePaymentMutations";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { EmployeePaymentList } from "@/components/ops/payroll/employee-payment-list";
import { EmployeePayrollFilters } from "@/components/ops/payroll/employee-payroll-filters";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { PayrollSummary } from "@/components/ops/payroll/payroll-summary";
import { buildPayrollRows, getPayrollSummary } from "@/components/ops/payroll/payroll-utils";
import { OpsSection, useOpsSelectedMonth } from "@/components/ops/shared";
import type { OpsEmployeeDetail } from "@/components/ops/types";
import {
  formatMonth,
  getMonthKey,
  toDateInputValue,
} from "@/components/ops/utils";

export const EmployeePayrollPanel = ({
  employee,
}: {
  employee: OpsEmployeeDetail;
}) => {
  const {
    goToNextMonth,
    goToPreviousMonth,
    month,
    monthKey,
    monthRange,
    resetToCurrentMonth,
    setMonth,
  } = useOpsSelectedMonth();
  const startDate = toDateInputValue(monthRange.start);
  const endDate = toDateInputValue(monthRange.end);
  const rangeFilters = {
    startDate: monthRange.start,
    endDate: monthRange.end,
  };

  const { payments, isLoading } = useEmployeePayments(
    { employeeId: employee.id, ...rangeFilters, statuses: ["RECORDED"] },
    `employee-payroll-${employee.id}-${monthKey}`
  );
  const { occurrences } = useJobOccurrences(
    {
      employeeId: employee.id,
      ...rangeFilters,
      includeArchived: false,
      statuses: ["DONE"],
    },
    `employee-payroll-occurrences-${employee.id}-${monthKey}`
  );
  const { voidPaymentAsync } = useEmployeePaymentMutations(employee.id);
  const rows = useMemo(
    () => buildPayrollRows([employee], occurrences, payments),
    [employee, occurrences, payments]
  );
  const summary = getPayrollSummary(rows, payments);
  const row = rows[0];
  const currentMonthKey = getMonthKey(new Date());
  const previousMonthKey = getMonthKey(
    new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
  );
  const activePreset =
    monthKey === currentMonthKey
      ? "current-month"
      : monthKey === previousMonthKey
        ? "previous-month"
        : null;
  const monthLabel = formatMonth(month);
  const handleDateMonthChange = (value: string) => {
    if (!value) return;
    setMonth(new Date(`${value}T00:00:00`));
  };

  return (
    <div className="space-y-4">
      <OpsSection
        actions={
          <PayrollDialog
            employeeId={employee.id}
            employees={[employee]}
            periodEnd={endDate}
            periodStart={startDate}
            suggestedAmount={row?.balance && row.balance > 0 ? row.balance : row?.suggestedAmount}
          />
        }
        description="Mismo periodo visual que visitas, para liquidar y revisar historial sin cambiar de contexto."
        title="Pagos a empleada"
      >
        <EmployeePayrollFilters
          activePreset={activePreset}
          endDate={endDate}
          monthLabel={monthLabel}
          onClear={() => {
            resetToCurrentMonth();
          }}
          onEndDateChange={handleDateMonthChange}
          onNextMonth={goToNextMonth}
          onPresetCurrentMonth={() => {
            resetToCurrentMonth();
          }}
          onPresetPreviousMonth={goToPreviousMonth}
          onPreviousMonth={goToPreviousMonth}
          onStartDateChange={handleDateMonthChange}
          paymentCount={payments.length}
          startDate={startDate}
        />
      </OpsSection>
      <PayrollSummary {...summary} showVoided={false} />
      <EmployeePaymentList
        employees={[employee]}
        isLoading={isLoading}
        payments={payments}
        showEmployeeLink={false}
        onVoid={async (paymentId) => {
          await voidPaymentAsync(paymentId);
        }}
      />
    </div>
  );
};

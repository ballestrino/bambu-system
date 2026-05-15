"use client";

import { useMemo, useState } from "react";

import { useEmployeePaymentMutations } from "@/components/ops/hooks/useEmployeePaymentMutations";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { EmployeePaymentList } from "@/components/ops/payroll/employee-payment-list";
import { EmployeePayrollFilters } from "@/components/ops/payroll/employee-payroll-filters";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { PayrollSummary } from "@/components/ops/payroll/payroll-summary";
import { buildPayrollRows, getPayrollSummary } from "@/components/ops/payroll/payroll-utils";
import { OpsSection } from "@/components/ops/shared";
import type { OpsEmployeeDetail } from "@/components/ops/types";
import { getMonthRange, toDateInputValue } from "@/components/ops/utils";

const getMonthRangeValues = (month: Date) => {
  const { start, end } = getMonthRange(month);
  return {
    endDate: toDateInputValue(end),
    startDate: toDateInputValue(start),
  };
};

export const EmployeePayrollPanel = ({
  employee,
}: {
  employee: OpsEmployeeDetail;
}) => {
  const currentMonth = getMonthRangeValues(new Date());
  const [startDate, setStartDate] = useState(currentMonth.startDate);
  const [endDate, setEndDate] = useState(currentMonth.endDate);
  const rangeFilters = {
    startDate: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
    endDate: endDate ? new Date(`${endDate}T23:59:59`) : undefined,
  };

  const { payments, isLoading } = useEmployeePayments(
    { employeeId: employee.id, ...rangeFilters },
    `employee-payroll-${employee.id}-${startDate}-${endDate}`
  );
  const { occurrences } = useJobOccurrences(
    {
      employeeId: employee.id,
      ...rangeFilters,
      includeArchived: false,
      statuses: ["DONE"],
    },
    `employee-payroll-occurrences-${employee.id}-${startDate}-${endDate}`
  );
  const { voidPaymentAsync } = useEmployeePaymentMutations(employee.id);
  const rows = useMemo(
    () => buildPayrollRows([employee], occurrences, payments),
    [employee, occurrences, payments]
  );
  const summary = getPayrollSummary(rows, payments);
  const row = rows[0];
  const previousMonth = new Date();
  previousMonth.setMonth(previousMonth.getMonth() - 1);
  const previousMonthRange = getMonthRangeValues(previousMonth);
  const activePreset =
    startDate === currentMonth.startDate && endDate === currentMonth.endDate
      ? "current-month"
      : startDate === previousMonthRange.startDate && endDate === previousMonthRange.endDate
        ? "previous-month"
        : null;
  const monthReference = startDate ? new Date(`${startDate}T00:00:00`) : new Date();
  const monthLabel = monthReference.toLocaleDateString("es-UY", {
    month: "long",
    year: "numeric",
  });

  const setMonthDates = (month: Date) => {
    const nextRange = getMonthRangeValues(month);
    setStartDate(nextRange.startDate);
    setEndDate(nextRange.endDate);
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
            setMonthDates(new Date());
          }}
          onEndDateChange={setEndDate}
          onNextMonth={() => {
            setMonthDates(
              new Date(monthReference.getFullYear(), monthReference.getMonth() + 1, 1)
            );
          }}
          onPresetCurrentMonth={() => {
            setMonthDates(new Date());
          }}
          onPresetPreviousMonth={() => {
            setMonthDates(
              new Date(monthReference.getFullYear(), monthReference.getMonth() - 1, 1)
            );
          }}
          onPreviousMonth={() => {
            setMonthDates(
              new Date(monthReference.getFullYear(), monthReference.getMonth() - 1, 1)
            );
          }}
          onStartDateChange={setStartDate}
          paymentCount={payments.length}
          startDate={startDate}
        />
      </OpsSection>
      <PayrollSummary {...summary} />
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

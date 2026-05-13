"use client";

import { useMemo, useState } from "react";

import { useEmployeePaymentMutations } from "@/components/ops/hooks/useEmployeePaymentMutations";
import { useEmployeePayments } from "@/components/ops/hooks/useEmployeePayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { EmployeePaymentList } from "@/components/ops/payroll/employee-payment-list";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { PayrollSummary } from "@/components/ops/payroll/payroll-summary";
import { buildPayrollRows, getPayrollSummary } from "@/components/ops/payroll/payroll-utils";
import type { OpsEmployeeDetail } from "@/components/ops/types";
import { getMonthRange, toDateInputValue } from "@/components/ops/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const EmployeePayrollPanel = ({
  employee,
}: {
  employee: OpsEmployeeDetail;
}) => {
  const currentMonth = getMonthRange(new Date());
  const [startDate, setStartDate] = useState(toDateInputValue(currentMonth.start));
  const [endDate, setEndDate] = useState(toDateInputValue(currentMonth.end));
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

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Pagos a empleada</CardTitle>
          <PayrollDialog
            employeeId={employee.id}
            employees={[employee]}
            periodEnd={endDate}
            periodStart={startDate}
            suggestedAmount={row?.balance && row.balance > 0 ? row.balance : row?.suggestedAmount}
          />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Periodo desde</Label>
            <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Periodo hasta</Label>
            <Input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
        </CardContent>
      </Card>
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

"use client";

import { useState } from "react";
import type { PaymentStatus } from "@prisma/client";

import { FinancialErrorState } from "@/components/ops/financial/financial-error-state";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { useEmployeePaymentMutations } from "@/components/ops/hooks/useEmployeePaymentMutations";
import { EmployeePaymentList } from "@/components/ops/payroll/employee-payment-list";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { PayrollFilters } from "@/components/ops/payroll/payroll-filters";
import { PayrollRowsPanel } from "@/components/ops/payroll/payroll-rows-panel";
import { PayrollSummary } from "@/components/ops/payroll/payroll-summary";
import {
  buildPayrollRows,
  getPaymentSummary,
  getPayrollSummary,
} from "@/components/ops/payroll/payroll-utils";
import { OpsSection } from "@/components/ops/shared";
import { formatMonth, toDateInputValue } from "@/components/ops/utils";

export const FinancialPayrollSection = ({ workspace }: { workspace: FinancialWorkspace }) => {
  const [employeeId, setEmployeeId] = useState("ALL");
  const [status, setStatus] = useState("RECORDED");
  const { voidPaymentAsync } = useEmployeePaymentMutations();
  const employees = employeeId === "ALL"
    ? workspace.employees
    : workspace.employees.filter((employee) => employee.id === employeeId);
  const scopedPayments = workspace.employeePayments.filter(
    (payment) => employeeId === "ALL" || payment.employeeId === employeeId
  );
  const visiblePayments = scopedPayments.filter(
    (payment) => status === "ALL" || payment.status === (status as PaymentStatus)
  );
  const occurrences = workspace.occurrences.filter((occurrence) =>
    employeeId === "ALL"
      ? true
      : occurrence.employees.some((item) => item.employeeId === employeeId)
  );
  const rows = buildPayrollRows(employees, occurrences, scopedPayments);
  const completeSummary = getPayrollSummary(rows, scopedPayments);
  const visibleSummary = getPaymentSummary(visiblePayments);
  const summary = { ...completeSummary, ...visibleSummary };
  const periodStart = toDateInputValue(workspace.monthRange.start);
  const periodEnd = toDateInputValue(workspace.monthRange.end);

  return (
    <div className="scroll-mt-28" id="pagos">
      <OpsSection
        actions={
          <PayrollDialog
            employees={workspace.employees}
            periodEnd={periodEnd}
            periodStart={periodStart}
          />
        }
        description="Importes sugeridos por el trabajo realizado y pagos asignados al mes."
        title="Pagos a empleadas"
      >
        <PayrollFilters
          employeeId={employeeId}
          employees={workspace.employees}
          isRefreshing={workspace.isFetching}
          monthLabel={formatMonth(workspace.month)}
          onClear={() => { setEmployeeId("ALL"); setStatus("RECORDED"); }}
          onEmployeeIdChange={setEmployeeId}
          onRefresh={workspace.refresh.payroll}
          onStatusChange={setStatus}
          status={status}
        />
        <div className="mt-5">
          {workspace.errors.payroll ? (
            <FinancialErrorState onRetry={workspace.refresh.payroll} />
          ) : (
            <div className="space-y-5">
              <PayrollSummary {...summary} showVoided={status !== "RECORDED"} />
              <div className="grid gap-5 xl:grid-cols-2">
                <PayrollRowsPanel
                  employees={workspace.employees}
                  periodEnd={periodEnd}
                  periodStart={periodStart}
                  rows={rows}
                />
                <EmployeePaymentList
                  employees={workspace.employees}
                  isLoading={workspace.loading.payroll}
                  onVoid={async (paymentId) => {
                    await voidPaymentAsync(paymentId);
                  }}
                  payments={visiblePayments}
                />
              </div>
            </div>
          )}
        </div>
      </OpsSection>
    </div>
  );
};

"use client";

import { useMemo, useState } from "react";
import type { PaymentStatus } from "@prisma/client";

import { FinancialEmployeePaymentsTable } from "@/components/ops/financial/financial-employee-payments-table";
import { FinancialErrorState } from "@/components/ops/financial/financial-error-state";
import { FinancialPayrollTable } from "@/components/ops/financial/financial-payroll-table";
import {
  financeSectionViews,
  type FinanceSectionView,
} from "@/components/ops/financial/financial-sections";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { useEmployeePaymentMutations } from "@/components/ops/hooks/useEmployeePaymentMutations";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { PayrollFilters } from "@/components/ops/payroll/payroll-filters";
import { getPayrollPeriodDescription } from "@/components/ops/payroll/payroll-period";
import { PayrollSummary } from "@/components/ops/payroll/payroll-summary";
import {
  buildPayrollRows,
  getPaymentSummary,
  getPayrollSummary,
} from "@/components/ops/payroll/payroll-utils";
import { OpsSection, OpsViewTabs } from "@/components/ops/shared";
import { formatMonth } from "@/components/ops/utils";
import { TabsContent } from "@/components/ui/tabs";

const searchPlaceholders: Record<FinanceSectionView<"pagos">, string> = {
  empleadas: "Buscar empleada",
  registrados: "Buscar empleada, referencia o monto",
};

export const FinancialPayrollSection = ({
  onViewChange,
  view,
  workspace,
}: {
  onViewChange: (view: string) => void;
  view: FinanceSectionView<"pagos">;
  workspace: FinancialWorkspace;
}) => {
  const [employeeId, setEmployeeId] = useState("ALL");
  const [status, setStatus] = useState("RECORDED");
  const [query, setQuery] = useState("");
  const { voidPaymentAsync } = useEmployeePaymentMutations();
  const scopedPayments = useMemo(
    () =>
      workspace.employeePayments.filter(
        (payment) => employeeId === "ALL" || payment.employeeId === employeeId
      ),
    [employeeId, workspace.employeePayments]
  );
  const visiblePayments = useMemo(
    () =>
      scopedPayments.filter(
        (payment) => status === "ALL" || payment.status === (status as PaymentStatus)
      ),
    [scopedPayments, status]
  );
  // Paid in arrears: this month's payments settle last month's hours.
  const { occurrences: workOccurrences, period } = workspace.payroll;
  const rows = useMemo(() => {
    const employees =
      employeeId === "ALL"
        ? workspace.employees
        : workspace.employees.filter((employee) => employee.id === employeeId);
    const occurrences = workOccurrences.filter((occurrence) =>
      employeeId === "ALL"
        ? true
        : occurrence.employees.some((item) => item.employeeId === employeeId)
    );
    return buildPayrollRows(employees, occurrences, scopedPayments);
  }, [employeeId, scopedPayments, workOccurrences, workspace.employees]);
  const summary = {
    ...getPayrollSummary(rows, scopedPayments),
    ...getPaymentSummary(visiblePayments),
  };
  const monthLabel = formatMonth(workspace.month);
  const resetKey = `${status}|${employeeId}`;
  const clearQuery = () => setQuery("");
  const isLoadingRows =
    workspace.loading.payroll || workspace.loading.payrollOccurrences;
  const counts = {
    empleadas: isLoadingRows ? undefined : rows.length,
    registrados: workspace.loading.payroll ? undefined : visiblePayments.length,
  };

  return (
    <OpsSection
      actions={<PayrollDialog employees={workspace.employees} />}
      description={`${getPayrollPeriodDescription(period)} El BPS usa Fonasa personal base de 3%; adicionales y CCM no están incluidos.`}
      title="Pagos a empleadas"
    >
      <PayrollFilters
        employeeId={employeeId}
        employees={workspace.employees}
        isRefreshing={workspace.isFetching}
        monthLabel={monthLabel}
        onClear={() => {
          setEmployeeId("ALL");
          setStatus("RECORDED");
          setQuery("");
        }}
        onEmployeeIdChange={setEmployeeId}
        onRefresh={workspace.refresh.payroll}
        onStatusChange={setStatus}
        search={{ onChange: setQuery, placeholder: searchPlaceholders[view], value: query }}
        status={status}
      />
      <div className="mt-5">
        {workspace.errors.payroll ? (
          <FinancialErrorState onRetry={workspace.refresh.payroll} />
        ) : (
          <div className="space-y-5">
            <PayrollSummary
              {...summary}
              period={period}
              showVoided={status !== "RECORDED"}
              size="compact"
            />
            <OpsViewTabs
              label="Vistas de Pagos"
              onValueChange={onViewChange}
              value={view}
              views={financeSectionViews.pagos.map((item) => ({
                ...item,
                count: counts[item.id],
              }))}
            >
              <TabsContent value="empleadas">
                <FinancialPayrollTable
                  caption={`Horas de ${period.workMonthName} y pagos de ${monthLabel} por empleada`}
                  employees={workspace.employees}
                  isLoading={isLoadingRows}
                  onClearQuery={clearQuery}
                  periodEnd={period.endDate}
                  periodStart={period.startDate}
                  query={query}
                  resetKey={resetKey}
                  rows={rows}
                />
              </TabsContent>
              <TabsContent value="registrados">
                <FinancialEmployeePaymentsTable
                  caption={`Pagos registrados en ${monthLabel}`}
                  employees={workspace.employees}
                  isLoading={workspace.loading.payroll}
                  onClearQuery={clearQuery}
                  onVoid={async (paymentId) => {
                    await voidPaymentAsync(paymentId);
                  }}
                  payments={visiblePayments}
                  query={query}
                  resetKey={resetKey}
                  showStatus={status !== "RECORDED"}
                />
              </TabsContent>
            </OpsViewTabs>
          </div>
        )}
      </div>
    </OpsSection>
  );
};

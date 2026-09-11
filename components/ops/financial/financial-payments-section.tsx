"use client";

import { useMemo, useState } from "react";
import type { PaymentStatus } from "@prisma/client";

import { FinancialErrorState } from "@/components/ops/financial/financial-error-state";
import { FinancialGeneratedPayTable } from "@/components/ops/financial/financial-generated-pay-table";
import { FinancialPaymentsTable } from "@/components/ops/financial/financial-payments-table";
import {
  financeSectionViews,
  type FinanceSectionView,
} from "@/components/ops/financial/financial-sections";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { useJobClientPaymentMutations } from "@/components/ops/hooks/useJobClientPaymentMutations";
import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { PaymentsFilters } from "@/components/ops/payments/payments-filters";
import { PaymentsSummary } from "@/components/ops/payments/payments-summary";
import { buildEmployeeGeneratedPay, getPaymentSummary } from "@/components/ops/payments/payment-utils";
import { OpsSection, OpsViewTabs } from "@/components/ops/shared";
import { formatMonth } from "@/components/ops/utils";
import { TabsContent } from "@/components/ui/tabs";

const searchPlaceholders: Record<FinanceSectionView<"cobros">, string> = {
  cobros: "Buscar trabajo, referencia o monto",
  equipo: "Buscar empleada",
};

export const FinancialPaymentsSection = ({
  onViewChange,
  view,
  workspace,
}: {
  onViewChange: (view: string) => void;
  view: FinanceSectionView<"cobros">;
  workspace: FinancialWorkspace;
}) => {
  const [jobId, setJobId] = useState("ALL");
  const [status, setStatus] = useState("RECORDED");
  const [query, setQuery] = useState("");
  const { voidPaymentAsync } = useJobClientPaymentMutations();
  const visiblePayments = useMemo(
    () =>
      workspace.clientPayments.filter(
        (payment) =>
          (jobId === "ALL" || payment.jobId === jobId) &&
          (status === "ALL" || payment.status === (status as PaymentStatus))
      ),
    [jobId, status, workspace.clientPayments]
  );
  const generatedPayRows = useMemo(
    () =>
      buildEmployeeGeneratedPay(
        workspace.occurrences.filter((item) => jobId === "ALL" || item.jobId === jobId)
      ).rows,
    [jobId, workspace.occurrences]
  );
  const summary = getPaymentSummary(visiblePayments);
  const monthLabel = formatMonth(workspace.month);
  const resetKey = `${status}|${jobId}`;
  const clearQuery = () => setQuery("");
  const counts = {
    cobros: workspace.loading.payments ? undefined : visiblePayments.length,
    equipo: workspace.loading.occurrences ? undefined : generatedPayRows.length,
  };

  return (
    <OpsSection
      actions={<PaymentDialog jobs={workspace.jobs} />}
      description="Ingresos recibidos de trabajos y atribución generada por el equipo."
      title="Cobros"
    >
      <PaymentsFilters
        isRefreshing={workspace.isFetching}
        jobId={jobId}
        jobs={workspace.jobs}
        monthLabel={monthLabel}
        onClear={() => {
          setJobId("ALL");
          setStatus("RECORDED");
          setQuery("");
        }}
        onJobIdChange={setJobId}
        onRefresh={workspace.refresh.payments}
        onStatusChange={setStatus}
        search={{ onChange: setQuery, placeholder: searchPlaceholders[view], value: query }}
        status={status}
      />
      <div className="mt-5">
        {workspace.errors.payments ? (
          <FinancialErrorState onRetry={workspace.refresh.payments} />
        ) : (
          <div className="space-y-5">
            <PaymentsSummary
              {...summary}
              showVoided={status !== "RECORDED"}
              size="compact"
            />
            <OpsViewTabs
              label="Vistas de Cobros"
              onValueChange={onViewChange}
              value={view}
              views={financeSectionViews.cobros.map((item) => ({
                ...item,
                count: counts[item.id],
              }))}
            >
              <TabsContent value="cobros">
                <FinancialPaymentsTable
                  caption={`Cobros asignados a ${monthLabel}`}
                  isLoading={workspace.loading.payments}
                  jobs={workspace.jobs}
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
              <TabsContent value="equipo">
                <FinancialGeneratedPayTable
                  caption={`Pago generado por empleada en ${monthLabel}`}
                  isLoading={workspace.loading.occurrences}
                  onClearQuery={clearQuery}
                  query={query}
                  resetKey={resetKey}
                  rows={generatedPayRows}
                />
              </TabsContent>
            </OpsViewTabs>
          </div>
        )}
      </div>
    </OpsSection>
  );
};

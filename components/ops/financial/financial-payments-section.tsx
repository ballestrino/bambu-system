"use client";

import { useMemo, useState } from "react";
import type { PaymentStatus } from "@prisma/client";

import { FinancialErrorState } from "@/components/ops/financial/financial-error-state";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { useJobClientPaymentMutations } from "@/components/ops/hooks/useJobClientPaymentMutations";
import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { PaymentsFilters } from "@/components/ops/payments/payments-filters";
import { PaymentsList } from "@/components/ops/payments/payments-list";
import { PaymentsSummary } from "@/components/ops/payments/payments-summary";
import { buildEmployeeGeneratedPay, getPaymentSummary } from "@/components/ops/payments/payment-utils";
import { EmployeeGeneratedPayPanel } from "@/components/ops/payments/revenue-attribution-panel";
import { OpsScrollContainer, OpsSection } from "@/components/ops/shared";
import { formatMonth } from "@/components/ops/utils";

export const FinancialPaymentsSection = ({ workspace }: { workspace: FinancialWorkspace }) => {
  const [jobId, setJobId] = useState("ALL");
  const [status, setStatus] = useState("RECORDED");
  const { voidPaymentAsync } = useJobClientPaymentMutations();
  const visiblePayments = workspace.clientPayments.filter(
    (payment) =>
      (jobId === "ALL" || payment.jobId === jobId) &&
      (status === "ALL" || payment.status === (status as PaymentStatus))
  );
  const visibleOccurrences = useMemo(
    () => workspace.occurrences.filter((item) => jobId === "ALL" || item.jobId === jobId),
    [jobId, workspace.occurrences]
  );
  const summary = getPaymentSummary(visiblePayments);

  return (
    <div className="scroll-mt-28" id="cobros">
      <OpsSection
        actions={<PaymentDialog jobs={workspace.jobs} />}
        description="Ingresos recibidos de trabajos y atribución generada por el equipo."
        title="Cobros"
      >
        <PaymentsFilters
          isRefreshing={workspace.isFetching}
          jobId={jobId}
          jobs={workspace.jobs}
          monthLabel={formatMonth(workspace.month)}
          onClear={() => { setJobId("ALL"); setStatus("RECORDED"); }}
          onJobIdChange={setJobId}
          onRefresh={workspace.refresh.payments}
          onStatusChange={setStatus}
          status={status}
        />
        <div className="mt-5">
          {workspace.errors.payments ? (
            <FinancialErrorState onRetry={workspace.refresh.payments} />
          ) : (
            <div className="space-y-5">
              <PaymentsSummary {...summary} showVoided={status !== "RECORDED"} />
              <div className="grid gap-5 xl:grid-cols-2">
                <OpsScrollContainer>
                  <PaymentsList
                    isLoading={workspace.loading.payments}
                    jobs={workspace.jobs}
                    onVoid={async (paymentId) => {
                      await voidPaymentAsync(paymentId);
                    }}
                    payments={visiblePayments}
                  />
                </OpsScrollContainer>
                <OpsScrollContainer>
                  <EmployeeGeneratedPayPanel {...buildEmployeeGeneratedPay(visibleOccurrences)} />
                </OpsScrollContainer>
              </div>
            </div>
          )}
        </div>
      </OpsSection>
    </div>
  );
};

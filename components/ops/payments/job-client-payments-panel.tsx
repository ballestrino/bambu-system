"use client";

import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { PaymentsList } from "@/components/ops/payments/payments-list";
import { PaymentsSummary } from "@/components/ops/payments/payments-summary";
import { formatMoney, getPaymentSummary } from "@/components/ops/payments/payment-utils";
import { useJobClientPaymentMutations } from "@/components/ops/hooks/useJobClientPaymentMutations";
import { useJobClientPayments } from "@/components/ops/hooks/useJobClientPayments";
import type { OpsJobDetail, OpsJobListItem } from "@/components/ops/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getJobBudgetPrice } from "@/lib/ops/job-budget-pricing";

export const JobClientPaymentsPanel = ({
  job,
  jobs,
}: {
  job: OpsJobDetail;
  jobs: OpsJobListItem[];
}) => {
  const { payments, isLoading } = useJobClientPayments({ jobId: job.id }, job.id);
  const { voidPaymentAsync } = useJobClientPaymentMutations(job.id);
  const summary = getPaymentSummary(payments);
  const expectedPrice = getJobBudgetPrice(job);
  const balance = expectedPrice === null ? null : expectedPrice - summary.recordedTotal;

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cobros del trabajo</CardTitle>
          <PaymentDialog jobId={job.id} jobs={jobs} />
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Registrado</p>
            <p className="text-xl font-semibold">{formatMoney(summary.recordedTotal)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Esperado</p>
            <p className="text-xl font-semibold">{expectedPrice === null ? "-" : formatMoney(expectedPrice)}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="text-xl font-semibold">{balance === null ? "-" : formatMoney(balance)}</p>
          </div>
        </CardContent>
      </Card>
      <PaymentsSummary {...summary} />
      <PaymentsList
        isLoading={isLoading}
        jobs={jobs}
        payments={payments}
        showJobLink={false}
        onVoid={async (paymentId) => {
          await voidPaymentAsync(paymentId);
        }}
      />
    </div>
  );
};

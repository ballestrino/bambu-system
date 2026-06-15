"use client";

import { useMemo, useState } from "react";

import { useJobClientPaymentMutations } from "@/components/ops/hooks/useJobClientPaymentMutations";
import { useJobClientPayments } from "@/components/ops/hooks/useJobClientPayments";
import { useJobOccurrences } from "@/components/ops/hooks/useJobOccurrences";
import { useJobs } from "@/components/ops/hooks/useJobs";
import { PaymentDialog } from "@/components/ops/payments/payment-dialog";
import { PaymentsFilters } from "@/components/ops/payments/payments-filters";
import { PaymentsList } from "@/components/ops/payments/payments-list";
import { PaymentsSummary } from "@/components/ops/payments/payments-summary";
import { EmployeeGeneratedPayPanel } from "@/components/ops/payments/revenue-attribution-panel";
import { buildEmployeeGeneratedPay, getPaymentSummary } from "@/components/ops/payments/payment-utils";
import { useOpsSelectedMonth } from "@/components/ops/shared";
import { formatMonth } from "@/components/ops/utils";
import type { PaymentStatus } from "@prisma/client";

export const PaymentsPage = () => {
  const { month, monthKey, monthRange, resetToCurrentMonth } =
    useOpsSelectedMonth();
  const [status, setStatus] = useState("RECORDED");
  const [jobId, setJobId] = useState("ALL");

  const filters = {
    assignedMonth: month,
    jobId: jobId === "ALL" ? undefined : jobId,
    statuses: status === "ALL" ? undefined : [status as PaymentStatus],
  };
  const monthLabel = formatMonth(month);

  const {
    jobs,
    isFetching: areJobsFetching,
    refetch: refetchJobs,
  } = useJobs({ includeArchived: false });
  const {
    payments,
    isFetching: arePaymentsFetching,
    isLoading,
    refetch: refetchPayments,
  } = useJobClientPayments(
    filters,
    `payments-${jobId}-${monthKey}-${status}`
  );
  const {
    occurrences,
    isFetching: areOccurrencesFetching,
    refetch: refetchOccurrences,
  } = useJobOccurrences(
    {
      jobId: jobId === "ALL" ? undefined : jobId,
      startDate: monthRange.start,
      endDate: monthRange.end,
      statuses: ["DONE"],
      includeArchived: false,
    },
    `payment-attribution-${jobId}-${monthKey}`
  );
  const { voidPaymentAsync } = useJobClientPaymentMutations();

  const summary = getPaymentSummary(payments);
  const attribution = useMemo(
    () => buildEmployeeGeneratedPay(occurrences),
    [occurrences]
  );
  const isRefreshing =
    areJobsFetching || arePaymentsFetching || areOccurrencesFetching;
  const refreshPaymentsData = async () => {
    await Promise.all([refetchJobs(), refetchPayments(), refetchOccurrences()]);
  };
  const clearFilters = () => {
    resetToCurrentMonth();
    setStatus("RECORDED");
    setJobId("ALL");
  };

  return (
    <div className="container flex w-full flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Cobros</h1>
          <p className="text-muted-foreground">Dinero recibido de clientes y atribución operativa.</p>
        </div>
        <PaymentDialog jobs={jobs} />
      </div>
      <PaymentsFilters
        isRefreshing={isRefreshing}
        jobId={jobId}
        jobs={jobs}
        monthLabel={monthLabel}
        onClear={clearFilters}
        onJobIdChange={setJobId}
        onRefresh={refreshPaymentsData}
        onStatusChange={setStatus}
        status={status}
      />
      <PaymentsSummary {...summary} showVoided={status !== "RECORDED"} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <PaymentsList
          isLoading={isLoading}
          jobs={jobs}
          payments={payments}
          onVoid={async (paymentId) => {
            await voidPaymentAsync(paymentId);
          }}
        />
        <EmployeeGeneratedPayPanel {...attribution} />
      </div>
    </div>
  );
};

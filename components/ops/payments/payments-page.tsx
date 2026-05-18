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
import { getMonthRange, toDateInputValue } from "@/components/ops/utils";
import type { PaymentStatus } from "@prisma/client";

export const PaymentsPage = () => {
  const currentMonth = getMonthRange(new Date());
  const [startDate, setStartDate] = useState(toDateInputValue(currentMonth.start));
  const [endDate, setEndDate] = useState(toDateInputValue(currentMonth.end));
  const [status, setStatus] = useState("ALL");
  const [jobId, setJobId] = useState("ALL");

  const filters = {
    jobId: jobId === "ALL" ? undefined : jobId,
    startDate: startDate ? new Date(`${startDate}T00:00:00`) : undefined,
    endDate: endDate ? new Date(`${endDate}T23:59:59`) : undefined,
    statuses: status === "ALL" ? undefined : [status as PaymentStatus],
  };

  const { jobs } = useJobs({ includeArchived: false });
  const { payments, isLoading } = useJobClientPayments(
    filters,
    `payments-${jobId}-${startDate}-${endDate}-${status}`
  );
  const { occurrences } = useJobOccurrences(
    {
      jobId: jobId === "ALL" ? undefined : jobId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      statuses: ["DONE"],
      includeArchived: false,
    },
    `payment-attribution-${jobId}-${startDate}-${endDate}`
  );
  const { voidPaymentAsync } = useJobClientPaymentMutations();

  const summary = getPaymentSummary(payments);
  const attribution = useMemo(
    () => buildEmployeeGeneratedPay(occurrences),
    [occurrences]
  );
  const clearFilters = () => {
    const nextMonth = getMonthRange(new Date());
    setStartDate(toDateInputValue(nextMonth.start));
    setEndDate(toDateInputValue(nextMonth.end));
    setStatus("ALL");
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
        endDate={endDate}
        jobId={jobId}
        jobs={jobs}
        onClear={clearFilters}
        onEndDateChange={setEndDate}
        onJobIdChange={setJobId}
        onStartDateChange={setStartDate}
        onStatusChange={setStatus}
        startDate={startDate}
        status={status}
      />
      <PaymentsSummary {...summary} />
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

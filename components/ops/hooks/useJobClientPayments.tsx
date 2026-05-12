"use client";

import { useQuery } from "@tanstack/react-query";

import { getJobClientPaymentsAction } from "@/components/ops/actions/get-job-client-payments.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { JobClientPaymentFilters } from "@/schemas/ops";

export const useJobClientPayments = (
  filters?: JobClientPaymentFilters,
  queryKeyScope?: string
) => {
  const paymentsQuery = useQuery({
    queryKey: [
      ...opsQueryKeys.clientPaymentScope(queryKeyScope ?? filters?.jobId),
      filters ?? {},
    ],
    queryFn: () => getJobClientPaymentsAction(filters),
    staleTime: 1000 * 60,
  });

  return {
    payments: paymentsQuery.data ?? [],
    isLoading: paymentsQuery.isLoading,
    isFetching: paymentsQuery.isFetching,
    error: paymentsQuery.error,
    refetch: paymentsQuery.refetch,
  };
};

"use client";

import { useQuery } from "@tanstack/react-query";

import { getJobEmployeeAssignmentsAction } from "@/components/ops/actions/get-job-employee-assignments.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { JobEmployeeAssignmentFilters } from "@/schemas/ops";

export const useJobEmployeeAssignments = (
  filters?: JobEmployeeAssignmentFilters,
  queryKeyScope?: string
) => {
  const assignmentsQuery = useQuery({
    queryKey: [
      ...opsQueryKeys.assignmentScope(
        queryKeyScope ?? filters?.jobId ?? filters?.employeeId
      ),
      filters ?? {},
    ],
    queryFn: () => getJobEmployeeAssignmentsAction(filters),
    staleTime: 1000 * 60,
  });

  return {
    assignments: assignmentsQuery.data ?? [],
    isLoading: assignmentsQuery.isLoading,
    isFetching: assignmentsQuery.isFetching,
    error: assignmentsQuery.error,
    refetch: assignmentsQuery.refetch,
  };
};

"use client";

import type { QueryClient } from "@tanstack/react-query";

import { opsQueryKeys } from "@/components/ops/query-keys";

type ScopeOptions = {
  employeeId?: string;
  jobId?: string;
};

const invalidateRoot = (queryClient: QueryClient, queryKey: readonly string[]) =>
  queryClient.invalidateQueries({ queryKey });

export const invalidateJobScopes = async (
  queryClient: QueryClient,
  { jobId }: ScopeOptions = {}
) => {
  await Promise.all([
    invalidateRoot(queryClient, opsQueryKeys.jobs),
    invalidateRoot(queryClient, opsQueryKeys.occurrenceRoot),
    invalidateRoot(queryClient, opsQueryKeys.scheduleRuleRoot),
    invalidateRoot(queryClient, opsQueryKeys.clientPayments),
    invalidateRoot(queryClient, opsQueryKeys.costs),
    invalidateRoot(queryClient, opsQueryKeys.calendarRoot),
    jobId
      ? queryClient.invalidateQueries({ queryKey: opsQueryKeys.job(jobId) })
      : Promise.resolve(),
  ]);
};

export const invalidateEmployeeScopes = async (
  queryClient: QueryClient,
  { employeeId }: ScopeOptions = {}
) => {
  await Promise.all([
    invalidateRoot(queryClient, opsQueryKeys.employees),
    invalidateRoot(queryClient, opsQueryKeys.assignments),
    invalidateRoot(queryClient, opsQueryKeys.occurrenceRoot),
    invalidateRoot(queryClient, opsQueryKeys.employeePayments),
    invalidateRoot(queryClient, opsQueryKeys.costs),
    invalidateRoot(queryClient, opsQueryKeys.calendarRoot),
    employeeId
      ? queryClient.invalidateQueries({
          queryKey: opsQueryKeys.employee(employeeId),
        })
      : Promise.resolve(),
  ]);
};

export const invalidateOperationalScopes = async (
  queryClient: QueryClient,
  scope: ScopeOptions = {}
) => {
  await Promise.all([
    invalidateJobScopes(queryClient, scope),
    invalidateEmployeeScopes(queryClient, scope),
  ]);
};

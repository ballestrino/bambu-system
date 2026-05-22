"use client";

import type { QueryClient } from "@tanstack/react-query";

import {
  findCachedItem,
  getOptimisticId,
  optimisticAuditUser,
} from "@/components/ops/cache/optimistic-cache";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type {
  OpsEmployee,
  OpsJobListItem,
  OpsOccurrence,
  OpsScheduleRule,
} from "@/components/ops/types";
import type {
  CreateJobOccurrenceInput,
  DetachJobOccurrenceInput,
  UpdateJobOccurrenceInput,
} from "@/schemas/ops";

const getEmployeeLinks = (
  queryClient: QueryClient,
  occurrenceId: string,
  employeeIds: string[] = []
) =>
  employeeIds.map((employeeId) => ({
    id: getOptimisticId("occurrence-employee"),
    createdAt: new Date(),
    employee:
      findCachedItem<OpsEmployee>(queryClient, opsQueryKeys.employees, employeeId) ??
      ({ id: employeeId, name: "Empleado" } as OpsEmployee),
    employeeId,
    jobOccurrenceId: occurrenceId,
  }));

const getCachedScheduleRule = (
  queryClient: QueryClient,
  scheduleRuleId?: string | null
) => {
  if (!scheduleRuleId) return null;
  for (const [, rules] of queryClient.getQueriesData<OpsScheduleRule[]>({
    queryKey: opsQueryKeys.scheduleRuleRoot,
  })) {
    const rule = rules?.find((current) => current.id === scheduleRuleId);
    if (rule) return rule;
  }
  return null;
};

export const buildOptimisticOccurrence = (
  queryClient: QueryClient,
  values: CreateJobOccurrenceInput
): OpsOccurrence => {
  const now = new Date();
  const id = getOptimisticId("occurrence");
  const job = findCachedItem<OpsJobListItem>(queryClient, opsQueryKeys.jobs, values.jobId);

  return {
    ...values,
    id,
    actualEndAt: values.actualEndAt ?? null,
    actualStartAt: values.actualStartAt ?? null,
    archivedAt: null,
    createdAt: now,
    createdBy: optimisticAuditUser,
    createdById: optimisticAuditUser.id,
    employees: getEmployeeLinks(queryClient, id, values.employeeIds),
    isDetached: values.isDetached ?? false,
    job: job
      ? { id: job.id, name: job.name, status: job.status }
      : { id: values.jobId, name: "Trabajo", status: "ACTIVE" },
    notes: values.notes ?? null,
    scheduleRule: getCachedScheduleRule(queryClient, values.scheduleRuleId),
    scheduleRuleId: values.scheduleRuleId ?? null,
    status: values.status ?? "SCHEDULED",
    updatedAt: now,
    updatedBy: null,
    updatedById: null,
  } as OpsOccurrence;
};

export const patchOptimisticOccurrence =
  (
    queryClient: QueryClient,
    values: UpdateJobOccurrenceInput | DetachJobOccurrenceInput
  ) =>
  (occurrence: OpsOccurrence): OpsOccurrence => {
    const scheduleRuleId =
      "scheduleRuleId" in values ? values.scheduleRuleId ?? null : occurrence.scheduleRuleId;

    return {
      ...occurrence,
      ...values,
      employees: values.employeeIds
        ? getEmployeeLinks(queryClient, occurrence.id, values.employeeIds)
        : occurrence.employees,
      scheduleRule: getCachedScheduleRule(queryClient, scheduleRuleId),
      scheduleRuleId,
      updatedAt: new Date(),
    } as OpsOccurrence;
  };

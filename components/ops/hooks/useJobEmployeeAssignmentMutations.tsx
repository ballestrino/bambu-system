"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveJobEmployeeAssignmentAction } from "@/components/ops/actions/jobs/archive-job-employee-assignment.action";
import { createJobEmployeeAssignmentAction } from "@/components/ops/actions/jobs/create-job-employee-assignment.action";
import { updateJobEmployeeAssignmentAction } from "@/components/ops/actions/jobs/update-job-employee-assignment.action";
import {
  findCachedItem,
  getOptimisticId,
  mapListItems,
  optimisticAuditUser,
  patchListItem,
  reconcileListItem,
  restoreSnapshots,
  snapshotQueries,
} from "@/components/ops/cache/optimistic-cache";
import { matchesAssignmentFilters, sortAssignments } from "@/components/ops/cache/optimistic-filters";
import { showMutationError, stripMutationErrorAction, type MutationErrorAction } from "@/components/ops/cache/mutation-toast";
import { opsQueryKeys } from "@/components/ops/query-keys";
import { invalidateVisitScopes } from "@/components/ops/hooks/useOpsInvalidation";
import type {
  OpsEmployee,
  OpsJobEmployeeAssignment,
  OpsJobListItem,
  OpsOccurrence,
} from "@/components/ops/types";
import type { CreateJobEmployeeAssignmentInput, UpdateJobEmployeeAssignmentInput } from "@/schemas/ops";

const assignmentRoots = [
  opsQueryKeys.assignments,
  opsQueryKeys.occurrenceRoot,
  opsQueryKeys.calendarRoot,
];

const buildOptimisticAssignment = (
  queryClient: ReturnType<typeof useQueryClient>,
  values: CreateJobEmployeeAssignmentInput
): OpsJobEmployeeAssignment => {
  const now = new Date();
  const job = findCachedItem<OpsJobListItem>(queryClient, opsQueryKeys.jobs, values.jobId);
  const employee = findCachedItem<OpsEmployee>(
    queryClient,
    opsQueryKeys.employees,
    values.employeeId
  );
  return {
    ...values,
    id: getOptimisticId("assignment"),
    archivedAt: null,
    assignedTo: values.assignedTo ?? null,
    createdAt: now,
    createdBy: optimisticAuditUser,
    createdById: optimisticAuditUser.id,
    employee: employee ?? { id: values.employeeId, name: "Empleado" },
    job: job ?? { id: values.jobId, name: "Trabajo" },
    roleLabel: values.roleLabel ?? null,
    updatedAt: now,
    updatedBy: null,
    updatedById: null,
  } as OpsJobEmployeeAssignment;
};

const removeArchivedEmployeeFromFutureVisits = (
  queryClient: ReturnType<typeof useQueryClient>,
  assignment: OpsJobEmployeeAssignment
) => {
  const archivedAt = new Date();
  mapListItems<OpsOccurrence>(queryClient, opsQueryKeys.occurrenceRoot, (occurrence) => {
    if (
      occurrence.jobId !== assignment.jobId ||
      occurrence.isDetached ||
      occurrence.status !== "SCHEDULED" ||
      new Date(occurrence.scheduledStartAt).getTime() < archivedAt.getTime()
    ) {
      return occurrence;
    }

    return {
      ...occurrence,
      employees: occurrence.employees.filter(
        (item) => item.employeeId !== assignment.employeeId
      ),
    };
  });
};

export const useJobEmployeeAssignmentMutations = (_jobId?: string, _employeeId?: string) => {
  void _jobId;
  void _employeeId;
  const queryClient = useQueryClient();

  const createAssignmentMutation = useMutation({
    mutationFn: (values: CreateJobEmployeeAssignmentInput & MutationErrorAction) =>
      createJobEmployeeAssignmentAction(stripMutationErrorAction(values)),
    onMutate: async (values) => {
      const snapshots = await snapshotQueries(queryClient, assignmentRoots);
      const optimisticAssignment = buildOptimisticAssignment(queryClient, values);

      reconcileListItem(queryClient, opsQueryKeys.assignments, optimisticAssignment, {
        matches: matchesAssignmentFilters,
        sort: sortAssignments,
      });
      return { optimisticId: optimisticAssignment.id, snapshots };
    },
    onSuccess: (assignment, _values, context) => {
      if (!assignment) return;
      reconcileListItem(queryClient, opsQueryKeys.assignments, assignment, {
        matches: matchesAssignmentFilters,
        sort: sortAssignments,
        tempId: context?.optimisticId,
      });
      void invalidateVisitScopes(queryClient);
      toast.success("Empleada asignada");
    },
    onError: (error, values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al asignar la empleada", values.onErrorAction);
    },
  });

  const updateAssignmentMutation = useMutation({
    mutationFn: ({
      assignmentId,
      values,
    }: {
      assignmentId: string;
      values: UpdateJobEmployeeAssignmentInput;
    } & MutationErrorAction) => updateJobEmployeeAssignmentAction(assignmentId, values),
    onMutate: async ({ assignmentId, values }) => {
      const snapshots = await snapshotQueries(queryClient, assignmentRoots);
      patchListItem<OpsJobEmployeeAssignment>(
        queryClient,
        opsQueryKeys.assignments,
        assignmentId,
        (assignment) => ({ ...assignment, ...values, updatedAt: new Date() }),
        { matches: matchesAssignmentFilters, sort: sortAssignments }
      );
      return { snapshots };
    },
    onSuccess: (assignment) => {
      if (!assignment) return;
      reconcileListItem(queryClient, opsQueryKeys.assignments, assignment, {
        matches: matchesAssignmentFilters,
        sort: sortAssignments,
      });
      void invalidateVisitScopes(queryClient);
      toast.success("Asignacion actualizada");
    },
    onError: (error, values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al actualizar la asignacion", values.onErrorAction);
    },
  });

  const archiveAssignmentMutation = useMutation({
    mutationFn: (assignmentId: string) => archiveJobEmployeeAssignmentAction(assignmentId),
    onMutate: async (assignmentId) => {
      const snapshots = await snapshotQueries(queryClient, assignmentRoots);
      let nextAssignment: OpsJobEmployeeAssignment | null = null;
      patchListItem<OpsJobEmployeeAssignment>(
        queryClient,
        opsQueryKeys.assignments,
        assignmentId,
        (assignment) => {
          nextAssignment = { ...assignment, archivedAt: new Date(), updatedAt: new Date() };
          return nextAssignment;
        },
        { matches: matchesAssignmentFilters, sort: sortAssignments }
      );
      if (nextAssignment) removeArchivedEmployeeFromFutureVisits(queryClient, nextAssignment);
      return { snapshots };
    },
    onSuccess: (assignment) => {
      if (!assignment) return;
      reconcileListItem(queryClient, opsQueryKeys.assignments, assignment, {
        matches: matchesAssignmentFilters,
        sort: sortAssignments,
      });
      removeArchivedEmployeeFromFutureVisits(queryClient, assignment);
      void invalidateVisitScopes(queryClient);
      toast.success("Empleada desasignada");
    },
    onError: (error, _assignmentId, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al desasignar la empleada");
    },
  });

  return {
    createAssignmentAsync: createAssignmentMutation.mutateAsync,
    updateAssignmentAsync: updateAssignmentMutation.mutateAsync,
    archiveAssignmentAsync: archiveAssignmentMutation.mutateAsync,
    isCreating: createAssignmentMutation.isPending,
    isUpdating: updateAssignmentMutation.isPending,
    isArchiving: archiveAssignmentMutation.isPending,
  };
};

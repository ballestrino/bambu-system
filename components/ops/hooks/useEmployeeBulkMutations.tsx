"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveEmployeesAction } from "@/components/ops/actions/employees/archive-employees.action";
import { setEmployeesActiveAction } from "@/components/ops/actions/employees/set-employees-active.action";
import {
  patchListItem,
  reconcileListItem,
  restoreSnapshots,
  snapshotQueries,
  upsertDetail,
} from "@/components/ops/cache/optimistic-cache";
import {
  matchesEmployeeFilters,
  sortEmployees,
} from "@/components/ops/cache/optimistic-filters";
import { showMutationError } from "@/components/ops/cache/mutation-toast";
import { opsQueryKeys } from "@/components/ops/query-keys";
import { invalidateVisitScopes } from "@/components/ops/hooks/useOpsInvalidation";
import type { OpsEmployee } from "@/components/ops/types";

const employeeRoots = [
  opsQueryKeys.employees,
  opsQueryKeys.assignments,
  opsQueryKeys.occurrenceRoot,
  opsQueryKeys.calendarRoot,
];

const listOptions = { matches: matchesEmployeeFilters, sort: sortEmployees };

const employeesLabel = (count: number) =>
  count === 1 ? "1 empleada" : `${count} empleadas`;

// Activar, desactivar y archivar varias empleadas desde la tabla (feature 30).
// Las archivadas no cambian: el servidor las saltea y la caché también.
export const useEmployeeBulkMutations = () => {
  const queryClient = useQueryClient();

  const patchEmployees = (
    employeeIds: string[],
    patch: (employee: OpsEmployee) => OpsEmployee
  ) => {
    for (const employeeId of employeeIds) {
      patchListItem<OpsEmployee>(
        queryClient,
        opsQueryKeys.employees,
        employeeId,
        (employee) => (employee.archivedAt ? employee : patch(employee)),
        listOptions
      );
    }
  };

  const reconcileEmployees = (employees: OpsEmployee[]) => {
    for (const employee of employees) {
      reconcileListItem(queryClient, opsQueryKeys.employees, employee, listOptions);
      upsertDetail(queryClient, opsQueryKeys.employee(employee.id), employee);
    }
    void invalidateVisitScopes(queryClient);
  };

  const setActiveMutation = useMutation({
    mutationFn: ({ employeeIds, isActive }: { employeeIds: string[]; isActive: boolean }) =>
      setEmployeesActiveAction(employeeIds, isActive),
    onMutate: async ({ employeeIds, isActive }) => {
      const snapshots = await snapshotQueries(queryClient, employeeRoots);
      patchEmployees(employeeIds, (employee) => ({
        ...employee,
        isActive,
        updatedAt: new Date(),
      }));
      return { snapshots };
    },
    onSuccess: (employees, { isActive }) => {
      reconcileEmployees(employees as OpsEmployee[]);
      toast.success(
        `${employeesLabel(employees.length)} ${isActive ? "activada" : "desactivada"}${employees.length === 1 ? "" : "s"}`
      );
    },
    onError: (error, { isActive }, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, `Error al ${isActive ? "activar" : "desactivar"} las empleadas`);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: (employeeIds: string[]) => archiveEmployeesAction(employeeIds),
    onMutate: async (employeeIds) => {
      const snapshots = await snapshotQueries(queryClient, employeeRoots);
      const now = new Date();
      patchEmployees(employeeIds, (employee) => ({
        ...employee,
        archivedAt: now,
        isActive: false,
        updatedAt: now,
      }));
      return { snapshots };
    },
    onSuccess: (employees) => {
      reconcileEmployees(employees as OpsEmployee[]);
      toast.success(
        `${employeesLabel(employees.length)} archivada${employees.length === 1 ? "" : "s"}`
      );
    },
    onError: (error, _employeeIds, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al archivar las empleadas");
    },
  });

  return {
    setEmployeesActiveAsync: setActiveMutation.mutateAsync,
    archiveEmployeesAsync: archiveMutation.mutateAsync,
    isPending: setActiveMutation.isPending || archiveMutation.isPending,
  };
};

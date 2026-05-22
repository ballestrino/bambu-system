"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { archiveEmployeeAction } from "@/components/ops/actions/employees/archive-employee.action";
import { createEmployeeAction } from "@/components/ops/actions/employees/create-employee.action";
import { updateEmployeeAction } from "@/components/ops/actions/employees/update-employee.action";
import {
  getOptimisticId,
  optimisticAuditUser,
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
import {
  showMutationError,
  stripMutationErrorAction,
  type MutationErrorAction,
} from "@/components/ops/cache/mutation-toast";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { OpsEmployee } from "@/components/ops/types";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "@/schemas/ops";

const employeeRoots = [
  opsQueryKeys.employees,
  opsQueryKeys.assignments,
  opsQueryKeys.occurrenceRoot,
  opsQueryKeys.calendarRoot,
];

const buildOptimisticEmployee = (values: CreateEmployeeInput): OpsEmployee => {
  const now = new Date();

  return {
    ...values,
    id: getOptimisticId("employee"),
    archivedAt: null,
    createdAt: now,
    createdBy: optimisticAuditUser,
    createdById: optimisticAuditUser.id,
    email: values.email ?? null,
    hourlyRate: values.hourlyRate ?? null,
    isActive: values.isActive ?? true,
    notes: values.notes ?? null,
    phone: values.phone ?? null,
    updatedAt: now,
    updatedBy: null,
    updatedById: null,
  } as OpsEmployee;
};

export const useEmployeeMutations = () => {
  const queryClient = useQueryClient();

  const createEmployeeMutation = useMutation({
    mutationFn: (values: CreateEmployeeInput & MutationErrorAction) =>
      createEmployeeAction(stripMutationErrorAction(values)),
    onMutate: async (values) => {
      const snapshots = await snapshotQueries(queryClient, employeeRoots);
      const optimisticEmployee = buildOptimisticEmployee(values);

      reconcileListItem(queryClient, opsQueryKeys.employees, optimisticEmployee, {
        matches: matchesEmployeeFilters,
        sort: sortEmployees,
      });

      return { optimisticId: optimisticEmployee.id, snapshots };
    },
    onSuccess: (employee, _values, context) => {
      if (!employee) return;
      reconcileListItem(queryClient, opsQueryKeys.employees, employee, {
        matches: matchesEmployeeFilters,
        sort: sortEmployees,
        tempId: context?.optimisticId,
      });
      upsertDetail(queryClient, opsQueryKeys.employee(employee.id), employee);
      toast.success("Empleada creada");
    },
    onError: (error, values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al crear la empleada", values.onErrorAction);
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: ({
      employeeId,
      values,
    }: {
      employeeId: string;
      values: UpdateEmployeeInput;
    } & MutationErrorAction) => updateEmployeeAction(employeeId, values),
    onMutate: async ({ employeeId, values }) => {
      const snapshots = await snapshotQueries(queryClient, employeeRoots);
      patchListItem<OpsEmployee>(
        queryClient,
        opsQueryKeys.employees,
        employeeId,
        (employee) => ({ ...employee, ...values, updatedAt: new Date() }) as OpsEmployee,
        { matches: matchesEmployeeFilters, sort: sortEmployees }
      );

      return { snapshots };
    },
    onSuccess: (employee) => {
      if (!employee) return;
      reconcileListItem(queryClient, opsQueryKeys.employees, employee, {
        matches: matchesEmployeeFilters,
        sort: sortEmployees,
      });
      upsertDetail(queryClient, opsQueryKeys.employee(employee.id), employee);
      toast.success("Empleada actualizada");
    },
    onError: (error, values, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al actualizar la empleada", values.onErrorAction);
    },
  });

  const archiveEmployeeMutation = useMutation({
    mutationFn: (employeeId: string) => archiveEmployeeAction(employeeId),
    onMutate: async (employeeId) => {
      const snapshots = await snapshotQueries(queryClient, employeeRoots);
      patchListItem<OpsEmployee>(
        queryClient,
        opsQueryKeys.employees,
        employeeId,
        (employee) => ({
          ...employee,
          archivedAt: new Date(),
          isActive: false,
          updatedAt: new Date(),
        }),
        { matches: matchesEmployeeFilters, sort: sortEmployees }
      );

      return { snapshots };
    },
    onSuccess: (employee) => {
      if (!employee) return;
      reconcileListItem(queryClient, opsQueryKeys.employees, employee, {
        matches: matchesEmployeeFilters,
        sort: sortEmployees,
      });
      upsertDetail(queryClient, opsQueryKeys.employee(employee.id), employee);
      toast.success("Empleada archivada");
    },
    onError: (error, _employeeId, context) => {
      restoreSnapshots(queryClient, context?.snapshots);
      showMutationError(error, "Error al archivar la empleada");
    },
  });

  return {
    createEmployeeAsync: createEmployeeMutation.mutateAsync,
    updateEmployeeAsync: updateEmployeeMutation.mutateAsync,
    archiveEmployeeAsync: archiveEmployeeMutation.mutateAsync,
    isCreating: createEmployeeMutation.isPending,
    isUpdating: updateEmployeeMutation.isPending,
    isArchiving: archiveEmployeeMutation.isPending,
  };
};

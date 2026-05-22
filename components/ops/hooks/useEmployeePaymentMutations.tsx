"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createEmployeePaymentAction } from "@/components/ops/actions/employees/create-employee-payment.action";
import { updateEmployeePaymentAction } from "@/components/ops/actions/employees/update-employee-payment.action";
import { voidEmployeePaymentAction } from "@/components/ops/actions/employees/void-employee-payment.action";
import { invalidateEmployeeScopes } from "@/components/ops/hooks/useOpsInvalidation";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type {
  CreateEmployeePaymentInput,
  UpdateEmployeePaymentInput,
} from "@/schemas/ops";

export const useEmployeePaymentMutations = (employeeId?: string) => {
  const queryClient = useQueryClient();

  const invalidatePaymentQueries = async (paymentEmployeeId?: string) => {
    const scope = paymentEmployeeId ?? employeeId;

    await Promise.all([
      invalidateEmployeeScopes(queryClient, { employeeId: scope }),
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.employeePayments }),
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.employeePaymentScope() }),
      scope
        ? queryClient.invalidateQueries({
            queryKey: opsQueryKeys.employeePaymentScope(scope),
          })
        : Promise.resolve(),
    ]);
  };

  const createPaymentMutation = useMutation({
    mutationFn: (values: CreateEmployeePaymentInput) =>
      createEmployeePaymentAction(values),
    onSuccess: async (payment) => {
      if (!payment) return;
      toast.success("Pago creado");
      await invalidatePaymentQueries(payment.employeeId);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear el pago");
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({
      paymentId,
      values,
    }: {
      paymentId: string;
      values: UpdateEmployeePaymentInput;
    }) => updateEmployeePaymentAction(paymentId, values),
    onSuccess: async (payment) => {
      if (!payment) return;
      toast.success("Pago actualizado");
      await invalidatePaymentQueries(payment.employeeId);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el pago");
    },
  });

  const voidPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => voidEmployeePaymentAction(paymentId),
    onSuccess: async (payment) => {
      if (!payment) return;
      toast.success("Pago anulado");
      await invalidatePaymentQueries(payment.employeeId);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al anular el pago");
    },
  });

  return {
    createPaymentAsync: createPaymentMutation.mutateAsync,
    updatePaymentAsync: updatePaymentMutation.mutateAsync,
    voidPaymentAsync: voidPaymentMutation.mutateAsync,
    isCreating: createPaymentMutation.isPending,
    isUpdating: updatePaymentMutation.isPending,
    isVoiding: voidPaymentMutation.isPending,
  };
};


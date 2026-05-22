"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createJobClientPaymentAction } from "@/components/ops/actions/payments/create-job-client-payment.action";
import { updateJobClientPaymentAction } from "@/components/ops/actions/payments/update-job-client-payment.action";
import { voidJobClientPaymentAction } from "@/components/ops/actions/payments/void-job-client-payment.action";
import { invalidateJobScopes } from "@/components/ops/hooks/useOpsInvalidation";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type {
  CreateJobClientPaymentInput,
  UpdateJobClientPaymentInput,
} from "@/schemas/ops";

export const useJobClientPaymentMutations = (jobId?: string) => {
  const queryClient = useQueryClient();

  const invalidatePaymentQueries = async (paymentJobId?: string) => {
    const scope = paymentJobId ?? jobId;

    await Promise.all([
      invalidateJobScopes(queryClient, { jobId: scope }),
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.clientPayments }),
      queryClient.invalidateQueries({ queryKey: opsQueryKeys.clientPaymentScope() }),
      scope
        ? queryClient.invalidateQueries({
            queryKey: opsQueryKeys.clientPaymentScope(scope),
          })
        : Promise.resolve(),
    ]);
  };

  const createPaymentMutation = useMutation({
    mutationFn: (values: CreateJobClientPaymentInput) =>
      createJobClientPaymentAction(values),
    onSuccess: async (payment) => {
      if (!payment) return;
      toast.success("Cobro creado");
      await invalidatePaymentQueries(payment.jobId);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear el cobro");
    },
  });

  const updatePaymentMutation = useMutation({
    mutationFn: ({
      paymentId,
      values,
    }: {
      paymentId: string;
      values: UpdateJobClientPaymentInput;
    }) => updateJobClientPaymentAction(paymentId, values),
    onSuccess: async (payment) => {
      if (!payment) return;
      toast.success("Cobro actualizado");
      await invalidatePaymentQueries(payment.jobId);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al actualizar el cobro");
    },
  });

  const voidPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => voidJobClientPaymentAction(paymentId),
    onSuccess: async (payment) => {
      if (!payment) return;
      toast.success("Cobro anulado");
      await invalidatePaymentQueries(payment.jobId);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al anular el cobro");
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


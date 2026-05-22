"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateOpsCostSettingsAction } from "@/components/ops/actions/costs/update-ops-cost-settings.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { OpsCostSettingsInput } from "@/schemas/ops";

export const useOpsCostSettingsMutation = () => {
  const queryClient = useQueryClient();

  const updateSettingsMutation = useMutation({
    mutationFn: (values: OpsCostSettingsInput) =>
      updateOpsCostSettingsAction(values),
    onSuccess: async () => {
      toast.success("Configuracion actualizada");
      await queryClient.invalidateQueries({ queryKey: opsQueryKeys.costSettings });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar configuracion"
      );
    },
  });

  return {
    updateSettingsAsync: updateSettingsMutation.mutateAsync,
    isUpdating: updateSettingsMutation.isPending,
  };
};


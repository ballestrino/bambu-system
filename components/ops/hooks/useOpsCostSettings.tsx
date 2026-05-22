"use client";

import { useQuery } from "@tanstack/react-query";

import { getOpsCostSettingsAction } from "@/components/ops/actions/costs/get-ops-cost-settings.action";
import { opsQueryKeys } from "@/components/ops/query-keys";

export const useOpsCostSettings = () => {
  const settingsQuery = useQuery({
    queryKey: opsQueryKeys.costSettings,
    queryFn: () => getOpsCostSettingsAction(),
    staleTime: 1000 * 60,
  });

  return {
    settings: settingsQuery.data,
    isLoading: settingsQuery.isLoading,
    isFetching: settingsQuery.isFetching,
    error: settingsQuery.error,
    refetch: settingsQuery.refetch,
  };
};


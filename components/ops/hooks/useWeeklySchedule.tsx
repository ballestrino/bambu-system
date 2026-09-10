"use client";

import { useQuery } from "@tanstack/react-query";

import { getWeeklyScheduleAction } from "@/components/ops/actions/schedules/get-weekly-schedule.action";
import { opsQueryKeys } from "@/components/ops/query-keys";

export const useWeeklySchedule = (weekStart?: string) => {
  const scheduleQuery = useQuery({
    queryKey: opsQueryKeys.weeklySchedule(weekStart),
    queryFn: () => getWeeklyScheduleAction({ weekStart }),
    staleTime: 1000 * 60 * 5,
  });

  return {
    error: scheduleQuery.error,
    isFetching: scheduleQuery.isFetching,
    isLoading: scheduleQuery.isLoading,
    refetch: scheduleQuery.refetch,
    schedule: scheduleQuery.data,
  };
};

"use client";

import { type InfiniteData, useInfiniteQuery } from "@tanstack/react-query";

import { getVisitWeekAction } from "@/components/ops/actions/jobs/get-visits.action";
import { opsQueryKeys } from "@/components/ops/query-keys";
import type { VisitWeekPage } from "@/components/ops/types";
import type { VisitFeedFilters } from "@/schemas/ops";

export type VisitFeedFilterState = Omit<VisitFeedFilters, "cursor">;

export const useInfiniteVisits = ({
  anchor,
  enabled,
  filters,
}: {
  anchor: Date;
  enabled: boolean;
  filters: VisitFeedFilterState;
}) => {
  const anchorKey = anchor.toISOString();
  const queryKey = opsQueryKeys.visitFeed({ anchor: anchorKey, filters });
  const visitsQuery = useInfiniteQuery<
    VisitWeekPage,
    Error,
    InfiniteData<VisitWeekPage>,
    typeof queryKey,
    string
  >({
    enabled,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: anchorKey,
    queryFn: ({ pageParam }) =>
      getVisitWeekAction({ ...filters, cursor: new Date(pageParam) }),
    queryKey,
    staleTime: 1000 * 60 * 5,
  });
  const pages = visitsQuery.data?.pages ?? [];

  return {
    error: visitsQuery.error,
    fetchNextPage: visitsQuery.fetchNextPage,
    hasNextPage: visitsQuery.hasNextPage,
    isFetching: visitsQuery.isFetching,
    isFetchingNextPage: visitsQuery.isFetchingNextPage,
    isLoading: visitsQuery.isLoading,
    occurrences: pages.flatMap((page) => page.occurrences),
    pages,
    refetch: visitsQuery.refetch,
  };
};

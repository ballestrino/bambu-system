"use client";

import type { QueryClient, QueryKey } from "@tanstack/react-query";

type Entity = {
  id: string;
};

export type QuerySnapshot = {
  data: unknown;
  queryKey: QueryKey;
};

export const getOptimisticId = (scope: string) =>
  `optimistic:${scope}:${Date.now()}:${Math.random().toString(36).slice(2)}`;

export const optimisticAuditUser = {
  id: "optimistic-user",
  name: "Guardando...",
  email: "optimistic@local",
};

export const snapshotQueries = async (
  queryClient: QueryClient,
  roots: QueryKey[]
) => {
  await Promise.all(
    roots.map((queryKey) => queryClient.cancelQueries({ queryKey }))
  );

  return roots.flatMap((queryKey) =>
    queryClient
      .getQueriesData({ queryKey })
      .map(([key, data]) => ({ data, queryKey: key }))
  );
};

export const restoreSnapshots = (
  queryClient: QueryClient,
  snapshots?: QuerySnapshot[]
) => {
  snapshots?.forEach(({ data, queryKey }) => {
    queryClient.setQueryData(queryKey, data);
  });
};

const queryFilters = (queryKey: QueryKey) => {
  const last = queryKey[queryKey.length - 1];
  return last && typeof last === "object" && !Array.isArray(last)
    ? (last as Record<string, unknown>)
    : {};
};

const updateListQueries = <T extends Entity>(
  queryClient: QueryClient,
  root: QueryKey,
  update: (items: T[], filters: Record<string, unknown>) => T[]
) => {
  queryClient.getQueriesData<T[]>({ queryKey: root }).forEach(([queryKey, data]) => {
    if (!data) return;
    queryClient.setQueryData(queryKey, update(data, queryFilters(queryKey)));
  });
};

export const reconcileListItem = <T extends Entity>(
  queryClient: QueryClient,
  root: QueryKey,
  item: T,
  options: {
    matches: (item: T, filters: Record<string, unknown>) => boolean;
    sort: (items: T[]) => T[];
    tempId?: string;
  }
) => {
  updateListQueries<T>(queryClient, root, (items, filters) => {
    const withoutExisting = items.filter(
      (current) => current.id !== item.id && current.id !== options.tempId
    );

    if (!options.matches(item, filters)) {
      return withoutExisting;
    }

    return options.sort([item, ...withoutExisting]);
  });
};

export const patchListItem = <T extends Entity>(
  queryClient: QueryClient,
  root: QueryKey,
  itemId: string,
  patch: (item: T) => T,
  options?: {
    matches?: (item: T, filters: Record<string, unknown>) => boolean;
    sort?: (items: T[]) => T[];
  }
) => {
  updateListQueries<T>(queryClient, root, (items, filters) => {
    const nextItems = items
      .map((item) => (item.id === itemId ? patch(item) : item))
      .filter((item) => !options?.matches || options.matches(item, filters));

    return options?.sort ? options.sort(nextItems) : nextItems;
  });
};

export const removeListItem = <T extends Entity>(
  queryClient: QueryClient,
  root: QueryKey,
  itemId: string
) => {
  updateListQueries<T>(queryClient, root, (items) =>
    items.filter((item) => item.id !== itemId)
  );
};

export const mapListItems = <T extends Entity>(
  queryClient: QueryClient,
  root: QueryKey,
  mapItem: (item: T) => T
) => {
  updateListQueries<T>(queryClient, root, (items) => items.map(mapItem));
};

export const findCachedItem = <T extends Entity>(
  queryClient: QueryClient,
  root: QueryKey,
  itemId?: string | null
) => {
  if (!itemId) return null;

  for (const [, data] of queryClient.getQueriesData<T[]>({ queryKey: root })) {
    const item = data?.find((current) => current.id === itemId);
    if (item) return item;
  }

  return null;
};

export const upsertDetail = <T extends Entity>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  item: T
) => {
  queryClient.setQueryData<T | undefined>(queryKey, (current) =>
    current ? { ...current, ...item } : current
  );
};

import type { QueryClient, QueryKey } from "@tanstack/react-query";

import type { BudgetFilters } from "@/components/budgets/interfaces/budget-filters";
import { budgetCategoryKeys, budgetKeys } from "@/components/budgets/query-keys";
import { opsQueryKeys } from "@/components/ops/query-keys";

type CachedBudget = { id: string };
type BudgetListData = {
  budgets: CachedBudget[];
  totalCount?: number;
  totalPages?: number;
};

const PAGING_FIELDS = new Set(["limit", "page"]);

const isEmptyFilter = (value: unknown) =>
  value === undefined ||
  value === null ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

const getListFilters = (queryKey: QueryKey) => queryKey[2] as BudgetFilters | undefined;

const hasBudgets = (data: unknown): data is BudgetListData =>
  Boolean(data) && Array.isArray((data as BudgetListData).budgets);

// Lists are ordered by updatedAt, so the only list known to start with a
// budget that was just created or saved is the first page with no filters.
export const isUnfilteredFirstPage = (filters: BudgetFilters | undefined) =>
  Boolean(filters) &&
  (filters?.page ?? 1) === 1 &&
  Object.entries(filters ?? {}).every(
    ([key, value]) => PAGING_FIELDS.has(key) || isEmptyFilter(value)
  );

const isOnTopList = (queryKey: QueryKey) => isUnfilteredFirstPage(getListFilters(queryKey));

// Budget lists opt into refetchOnMount (useBudgets), so marking them is
// enough: the one on screen refetches now and the rest when they mount.
export const invalidateBudgetLists = (queryClient: QueryClient) =>
  queryClient.invalidateQueries({ queryKey: budgetKeys.lists() });

// The app turns refetchOnMount off (providers/ReactQueryProvider.tsx), so a
// detail or picker that is not on screen would keep its old data when it
// mounts again. There are few of them: they are fetched again right away.
const refreshQueries = (queryClient: QueryClient, queryKey: QueryKey) =>
  queryClient.invalidateQueries({ queryKey, refetchType: "all" });

export const refreshBudgetDetail = (queryClient: QueryClient, slug: string) =>
  refreshQueries(queryClient, budgetKeys.detail(slug));

// A created, duplicated or saved budget goes first in the unfiltered first
// page right away, keeping the relations the list already had for it. Every
// list is then marked: the others may gain, lose or reorder it, and the write
// action returns the budget without all the relations a card shows.
export const putBudgetOnTop = async <Budget extends CachedBudget>(
  queryClient: QueryClient,
  budget: Budget,
  { isNew }: { isNew: boolean }
) => {
  queryClient
    .getQueriesData<BudgetListData>({ queryKey: budgetKeys.lists() })
    .forEach(([queryKey, data]) => {
      if (!hasBudgets(data)) return;
      const filters = getListFilters(queryKey);
      const previous = data.budgets.find(({ id }) => id === budget.id);
      const merged = { ...previous, ...budget };
      if (!isOnTopList(queryKey)) {
        if (previous) {
          queryClient.setQueryData<BudgetListData>(queryKey, {
            ...data,
            budgets: data.budgets.map((item) => (item.id === budget.id ? merged : item)),
          });
        }
        return;
      }
      const limit = filters?.limit ?? data.budgets.length + 1;
      const totalCount = (data.totalCount ?? 0) + (isNew ? 1 : 0);
      queryClient.setQueryData<BudgetListData>(queryKey, {
        ...data,
        budgets: [merged, ...data.budgets.filter(({ id }) => id !== budget.id)].slice(0, limit),
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      });
    });
  await invalidateBudgetLists(queryClient);
};

export const removeBudgetFromLists = (queryClient: QueryClient, budgetId: string) =>
  queryClient.setQueriesData<BudgetListData>({ queryKey: budgetKeys.lists() }, (old) =>
    hasBudgets(old)
      ? { ...old, budgets: old.budgets.filter(({ id }) => id !== budgetId) }
      : old
  );

// Details are keyed by slug; a deleted budget is found by the id it holds.
export const removeBudgetDetail = (queryClient: QueryClient, budgetId: string) =>
  queryClient.removeQueries({
    queryKey: budgetKeys.details(),
    predicate: (query) => (query.state.data as CachedBudget | undefined)?.id === budgetId,
  });

// Jobs pick their source budget from a separate operations query.
export const invalidateBudgetSources = (queryClient: QueryClient) =>
  refreshQueries(queryClient, opsQueryKeys.budgetSourcesRoot);

// For writes made outside the generator (agent, official budgets): every
// budget list and detail, plus the job budget picker.
export const invalidateBudgetScopes = (queryClient: QueryClient) =>
  Promise.all([
    invalidateBudgetLists(queryClient),
    refreshQueries(queryClient, budgetKeys.details()),
    invalidateBudgetSources(queryClient),
  ]);

// Budget cards and details show category names and colors, and a category
// detail counts its children, so any category write refreshes them.
export const invalidateCategoryScopes = (queryClient: QueryClient) =>
  Promise.all([
    refreshQueries(queryClient, budgetCategoryKeys.details()),
    invalidateBudgetLists(queryClient),
    refreshQueries(queryClient, budgetKeys.details()),
  ]);

import assert from "node:assert/strict";

import { QueryClient, type QueryKey } from "@tanstack/react-query";

import {
  invalidateBudgetScopes,
  invalidateCategoryScopes,
  isUnfilteredFirstPage,
  putBudgetOnTop,
  removeBudgetDetail,
  removeBudgetFromLists,
} from "../components/budgets/hooks/budget-cache";
import { budgetCategoryKeys, budgetKeys } from "../components/budgets/query-keys";
import { opsQueryKeys } from "../components/ops/query-keys";

type Row = { id: string; name?: string; budgetCategory?: string[] };
type List = { budgets: Row[]; totalCount: number; totalPages: number };

const topKey = budgetKeys.list({ limit: 2, page: 1, query: "", catIds: undefined });
const searchKey = budgetKeys.list({ limit: 10, page: 1, query: "oficina" });
const categoryKey = budgetKeys.list({ limit: 10, page: 1, query: "", catIds: ["cat_1"] });
const secondPageKey = budgetKeys.list({ limit: 2, page: 2, query: "" });

// Same defaults as providers/ReactQueryProvider.tsx; any refetch answers
// "refetched", so a test can tell a refetch from a mark.
const REFETCHED = "refetched";
const seed = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: { queryFn: async () => REFETCHED, refetchOnMount: false, staleTime: 60_000 },
    },
  });
  client.setQueryData<List>(topKey, {
    budgets: [{ id: "a", budgetCategory: ["Oficinas"] }, { id: "b" }],
    totalCount: 3,
    totalPages: 2,
  });
  client.setQueryData<List>(searchKey, {
    budgets: [{ id: "a", name: "Oficina", budgetCategory: ["Oficinas"] }],
    totalCount: 1,
    totalPages: 1,
  });
  client.setQueryData<List>(categoryKey, { budgets: [], totalCount: 0, totalPages: 0 });
  client.setQueryData<List>(secondPageKey, { budgets: [{ id: "c" }], totalCount: 3, totalPages: 2 });
  return client;
};
const list = (client: QueryClient, key: QueryKey) => client.getQueryData<List>(key)!;
const stale = (client: QueryClient, key: QueryKey) => client.getQueryState(key)?.isInvalidated;
const ids = (client: QueryClient, key: QueryKey) => list(client, key).budgets.map(({ id }) => id);

// Which list is the plain first page.
assert.equal(isUnfilteredFirstPage({ limit: 10, page: 1, query: "" }), true);
assert.equal(isUnfilteredFirstPage({ limit: 10, query: "", visitTypes: [] }), true);
assert.equal(isUnfilteredFirstPage({ limit: 10, page: 1, query: "oficina" }), false);
assert.equal(isUnfilteredFirstPage({ limit: 10, page: 1, catIds: ["cat_1"] }), false);
assert.equal(isUnfilteredFirstPage({ limit: 10, page: 2 }), false);
assert.equal(isUnfilteredFirstPage({ limit: 10, hasProducts: false }), false);
assert.equal(isUnfilteredFirstPage(undefined), false);

const main = async () => {
  // Create: on top of the plain first page, never written into a filtered list
  // (the old queryKey[1].query bug); every list is marked to refetch.
  {
    const client = seed();
    await putBudgetOnTop(client, { id: "new" }, { isNew: true });
    assert.deepEqual(ids(client, topKey), ["new", "a"]);
    assert.equal(list(client, topKey).totalCount, 4);
    assert.equal(list(client, topKey).totalPages, 2);
    assert.equal(stale(client, topKey), true);
    assert.deepEqual(ids(client, searchKey), ["a"]);
    assert.deepEqual(ids(client, categoryKey), []);
    assert.equal(stale(client, searchKey), true);
    assert.equal(stale(client, categoryKey), true);
    assert.equal(stale(client, secondPageKey), true);
  }

  // Update: moves to the top keeping the relations the list had, is merged in
  // the filtered list that holds it, and the filtered lists refetch.
  {
    const client = seed();
    await putBudgetOnTop(client, { id: "a", name: "Oficina Centro" }, { isNew: false });
    assert.deepEqual(ids(client, topKey), ["a", "b"]);
    assert.equal(list(client, topKey).totalCount, 3);
    assert.deepEqual(list(client, topKey).budgets[0].budgetCategory, ["Oficinas"]);
    assert.equal(list(client, searchKey).budgets[0].name, "Oficina Centro");
    assert.deepEqual(list(client, searchKey).budgets[0].budgetCategory, ["Oficinas"]);
    assert.equal(stale(client, searchKey), true);
  }
  {
    // A budget from the second page jumps to the first, which keeps its limit.
    const client = seed();
    await putBudgetOnTop(client, { id: "c" }, { isNew: false });
    assert.deepEqual(ids(client, topKey), ["c", "a"]);
    assert.equal(stale(client, secondPageKey), true);
  }

  // Delete: out of every list; the detail with that id goes, others stay.
  {
    const client = seed();
    client.setQueryData(budgetKeys.detail("oficina"), { id: "a" });
    client.setQueryData(budgetKeys.detail("hogar"), { id: "b" });
    removeBudgetFromLists(client, "a");
    removeBudgetDetail(client, "a");
    assert.deepEqual(ids(client, topKey), ["b"]);
    assert.deepEqual(ids(client, searchKey), []);
    assert.equal(client.getQueryData(budgetKeys.detail("oficina")), undefined);
    assert.deepEqual(client.getQueryData(budgetKeys.detail("hogar")), { id: "b" });
  }

  // Writes from the agent or official budgets mark every list and refetch the
  // details and the job budget picker even off screen, since refetchOnMount is
  // off; category writes do the same with category details and budgets.
  {
    const client = seed();
    client.setQueryData(budgetKeys.detail("oficina"), { id: "a" });
    client.setQueryData(opsQueryKeys.budgetSources({ query: "ofi" }), []);
    client.setQueryData(budgetCategoryKeys.roots(), []);
    client.setQueryData(budgetCategoryKeys.detail("cat_1"), { id: "cat_1" });
    await invalidateBudgetScopes(client);
    assert.equal(stale(client, topKey), true);
    assert.equal(client.getQueryData(budgetKeys.detail("oficina")), REFETCHED);
    assert.equal(client.getQueryData(opsQueryKeys.budgetSources({ query: "ofi" })), REFETCHED);
    assert.deepEqual(client.getQueryData(budgetCategoryKeys.detail("cat_1")), { id: "cat_1" });

    const categories = seed();
    categories.setQueryData(budgetCategoryKeys.roots(), []);
    categories.setQueryData(budgetCategoryKeys.detail("cat_1"), { id: "cat_1" });
    categories.setQueryData(budgetKeys.detail("oficina"), { id: "a" });
    await invalidateCategoryScopes(categories);
    assert.equal(categories.getQueryData(budgetCategoryKeys.detail("cat_1")), REFETCHED);
    assert.equal(categories.getQueryData(budgetKeys.detail("oficina")), REFETCHED);
    assert.deepEqual(categories.getQueryData(budgetCategoryKeys.roots()), []);
    assert.equal(stale(categories, categoryKey), true);
  }

  console.log("Budget cache checks passed");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

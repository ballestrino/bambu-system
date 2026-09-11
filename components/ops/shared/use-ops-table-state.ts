"use client";

import { useMemo, useState } from "react";

import {
  filterRowsBySearch,
  getNextSort,
  getTableViewSignature,
  paginateRows,
  resolvePageIndex,
  sortRows,
  type SearchFields,
  type SortAccessors,
  type SortDirection,
  type SortState,
} from "@/lib/ops/table-query";

export const OPS_TABLE_PAGE_SIZE = 25;

// Client-side search, sort and pagination over rows the page already holds.
// `getSearchFields` and `sortAccessors` must be module-level constants: they
// are memo dependencies, and a new function per render would refilter always.
export const useOpsTableState = <Row, Key extends string>({
  getSearchFields,
  initialSort,
  pageSize = OPS_TABLE_PAGE_SIZE,
  query,
  resetKey = "",
  rows,
  sortAccessors,
}: {
  getSearchFields: (row: Row) => SearchFields;
  initialSort: SortState<Key>;
  pageSize?: number;
  query: string;
  resetKey?: string;
  rows: readonly Row[];
  sortAccessors: SortAccessors<Row, Key>;
}) => {
  const [sort, setSort] = useState(initialSort);
  const [pageState, setPageState] = useState({ index: 0, signature: "" });
  const filteredRows = useMemo(
    () => filterRowsBySearch(rows, query, getSearchFields),
    [getSearchFields, query, rows]
  );
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortAccessors, sort),
    [filteredRows, sort, sortAccessors]
  );

  // A new query, order or filter set sends the reader back to page one. The
  // page index is stored with the signature it belongs to instead of being
  // reset from an effect, so there is no render with a stale page.
  const signature = getTableViewSignature(query, sort, resetKey);
  const page = paginateRows(sortedRows, resolvePageIndex(pageState, signature), pageSize);

  const setPageIndex = (index: number) => setPageState({ index, signature });

  const toggleSort = (key: Key, initialDirection: SortDirection = "asc") =>
    setSort((current) => getNextSort(current, key, initialDirection));

  return {
    ...page,
    rows: sortedRows,
    setPageIndex,
    sort,
    toggleSort,
  };
};

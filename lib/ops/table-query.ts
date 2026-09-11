import { createSearchMatcher } from "@/lib/search-text";

export type SortDirection = "asc" | "desc";

export type SortState<Key extends string> = {
  direction: SortDirection;
  key: Key;
};

export type SortValue = number | string | null;

export type SortAccessors<Row, Key extends string> = Record<
  Key,
  (row: Row) => SortValue
>;

export type SearchFields = (string | null | undefined)[];

const collator = new Intl.Collator("es", { numeric: true, sensitivity: "base" });

// Missing values ("Tarifa pendiente") sort last in both directions: they are
// incomplete data, not the smallest amount, and flipping the order should not
// bring them to the top.
export const compareSortValues = (
  left: SortValue,
  right: SortValue,
  direction: SortDirection
) => {
  if (left === null || right === null) {
    if (left === right) return 0;
    return left === null ? 1 : -1;
  }

  const order =
    typeof left === "number" && typeof right === "number"
      ? left - right
      : collator.compare(String(left), String(right));

  return direction === "asc" ? order : -order;
};

// Array.prototype.sort is stable, so ties keep the order the server sent.
export const sortRows = <Row, Key extends string>(
  rows: readonly Row[],
  accessors: SortAccessors<Row, Key>,
  sort: SortState<Key>
) => {
  const accessor = accessors[sort.key];
  return [...rows].sort((left, right) =>
    compareSortValues(accessor(left), accessor(right), sort.direction)
  );
};

export const filterRowsBySearch = <Row>(
  rows: readonly Row[],
  query: string,
  getFields: (row: Row) => SearchFields
) => {
  const matches = createSearchMatcher(query);
  return rows.filter((row) => matches(getFields(row)));
};

// The same column flips the direction; a new one starts where it reads best
// (latest dates and biggest amounts first, names from A).
export const getNextSort = <Key extends string>(
  current: SortState<Key>,
  key: Key,
  initialDirection: SortDirection
): SortState<Key> =>
  current.key === key
    ? { direction: current.direction === "asc" ? "desc" : "asc", key }
    : { direction: initialDirection, key };

// Everything that changes what the reader is looking at. A stored page index
// only applies under the signature it was chosen with; any other signature
// means a new query, order or filter set, and the table starts at page one.
export const getTableViewSignature = <Key extends string>(
  query: string,
  sort: SortState<Key>,
  resetKey: string
) => [query.trim(), sort.key, sort.direction, resetKey].join("|");

export const resolvePageIndex = (
  stored: { index: number; signature: string },
  signature: string
) => (stored.signature === signature ? stored.index : 0);

export const paginateRows = <Row>(
  rows: readonly Row[],
  pageIndex: number,
  pageSize: number
) => {
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safeIndex = Math.min(Math.max(0, Math.trunc(pageIndex)), pageCount - 1);
  const start = safeIndex * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  return {
    pageCount,
    pageIndex: safeIndex,
    pageRows,
    rangeEnd: start + pageRows.length,
    rangeStart: total ? start + 1 : 0,
    total,
  };
};

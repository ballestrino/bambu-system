"use client";

import type { ComponentProps, ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import {
  Table,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SortState } from "@/lib/ops/table-query";
import { cn } from "@/lib/utils";

// Ops-themed layer over the shadcn table primitives. The primitives keep the
// base theme tokens; these swap in the ops surface, border, and text tokens so
// the tables match the rest of Operations in light and dark.

// Record names double as the link to their detail page, replacing the old
// "Trabajo" / "Empleado" buttons on every card.
export const opsTableLinkClass =
  "rounded-sm font-medium underline-offset-4 hover:text-ops-bamboo-strong hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ops-bamboo/40";

// Secondary line under the first cell, holding what the hidden columns show
// on wider screens.
export const opsTableSublineClass = "mt-0.5 text-xs text-ops-text-muted";

export const OpsDataTable = ({
  caption,
  children,
  className,
  footer,
}: {
  caption: string;
  children: ReactNode;
  className?: string;
  footer?: ReactNode;
}) => (
  <div
    // scroll-mt clears the app's sticky top bar when the pager scrolls back up.
    className={cn(
      "scroll-mt-24 overflow-hidden rounded-[var(--ops-radius-row)] border border-ops-border bg-ops-surface",
      className
    )}
    data-slot="ops-data-table"
  >
    <Table className="text-ops-text">
      <TableCaption className="sr-only">{caption}</TableCaption>
      {children}
    </Table>
    {footer}
  </div>
);

export const OpsTableHeader = ({
  className,
  ...props
}: ComponentProps<typeof TableHeader>) => (
  <TableHeader
    className={cn("bg-ops-surface-muted [&_tr]:border-ops-border", className)}
    {...props}
  />
);

export const OpsTableFooter = ({
  className,
  ...props
}: ComponentProps<typeof TableFooter>) => (
  <TableFooter
    className={cn(
      "border-ops-border bg-ops-surface-muted/60 font-semibold",
      className
    )}
    {...props}
  />
);

export const OpsTableRow = ({
  className,
  ...props
}: ComponentProps<typeof TableRow>) => (
  <TableRow
    className={cn("border-ops-border hover:bg-ops-surface-muted/60", className)}
    {...props}
  />
);

export const OpsTableHead = ({
  className,
  ...props
}: ComponentProps<typeof TableHead>) => (
  <TableHead
    className={cn(
      "h-11 px-3 text-xs font-semibold uppercase tracking-wide text-ops-text-muted",
      className
    )}
    {...props}
  />
);

export const OpsTableCell = ({
  className,
  ...props
}: ComponentProps<typeof TableCell>) => (
  <TableCell className={cn("px-3 py-2.5", className)} {...props} />
);

export const OpsSortableHead = <Key extends string>({
  align = "left",
  className,
  label,
  onSort,
  sort,
  sortKey,
}: {
  align?: "left" | "right";
  className?: string;
  label: string;
  onSort: () => void;
  sort: SortState<Key>;
  sortKey: Key;
}) => {
  const isActive = sort.key === sortKey;
  const Icon = !isActive
    ? ChevronsUpDown
    : sort.direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <OpsTableHead
      // Only the sorted column carries aria-sort, as the ARIA spec recommends.
      aria-sort={
        isActive ? (sort.direction === "asc" ? "ascending" : "descending") : undefined
      }
      className={cn(align === "right" && "text-right", className)}
    >
      <button
        className={cn(
          "-mx-1 inline-flex min-h-11 items-center gap-1 rounded px-1 font-semibold uppercase tracking-wide transition-colors hover:text-ops-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ops-bamboo/40",
          align === "right" && "flex-row-reverse",
          isActive && "text-ops-text"
        )}
        onClick={onSort}
        type="button"
      >
        {label}
        <Icon aria-hidden className={cn("size-3.5", !isActive && "opacity-50")} />
      </button>
    </OpsTableHead>
  );
};

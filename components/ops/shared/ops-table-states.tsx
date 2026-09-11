"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

// Body rows for the non-data states of an ops table. They span every column
// so the header stays in place while loading or when nothing matches.

export const OpsTableMessageRow = ({
  action,
  colSpan,
  description,
  title,
}: {
  action?: ReactNode;
  colSpan: number;
  description?: string;
  title: string;
}) => (
  <TableRow className="border-ops-border hover:bg-transparent">
    <TableCell className="whitespace-normal px-4 py-10 text-center" colSpan={colSpan}>
      <p className="font-medium text-ops-text">{title}</p>
      {description ? (
        <p className="mt-1 text-sm text-ops-text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-3 flex justify-center">{action}</div> : null}
    </TableCell>
  </TableRow>
);

// A search miss is not the same as an empty month: it says what was searched
// and offers the way out, instead of implying there is no data at all.
export const OpsTableEmptyRow = ({
  colSpan,
  emptyDescription,
  emptyTitle,
  onClearQuery,
  query,
}: {
  colSpan: number;
  emptyDescription?: string;
  emptyTitle: string;
  onClearQuery: () => void;
  query: string;
}) => {
  const searched = query.trim();

  return searched ? (
    <OpsTableMessageRow
      action={
        <Button
          className="min-h-11 md:min-h-8"
          onClick={onClearQuery}
          size="sm"
          type="button"
          variant="outline"
        >
          Limpiar búsqueda
        </Button>
      }
      colSpan={colSpan}
      description="Revisá cómo está escrito o probá con otro dato."
      title={`Sin resultados para “${searched}”`}
    />
  ) : (
    <OpsTableMessageRow
      colSpan={colSpan}
      description={emptyDescription}
      title={emptyTitle}
    />
  );
};

export const OpsTableSkeletonRows = ({
  colSpan,
  rows = 5,
}: {
  colSpan: number;
  rows?: number;
}) => (
  <>
    {Array.from({ length: rows }, (_, index) => (
      <TableRow className="border-ops-border hover:bg-transparent" key={index}>
        <TableCell className="px-3 py-2.5" colSpan={colSpan}>
          {index === 0 ? <span className="sr-only">Cargando…</span> : null}
          <Skeleton className="h-7 w-full" />
        </TableCell>
      </TableRow>
    ))}
  </>
);

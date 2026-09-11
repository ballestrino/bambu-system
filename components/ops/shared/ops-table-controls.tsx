"use client";

import Link from "next/link";
import { useRef, type ComponentProps, type ComponentType, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RowActionProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
};

// 44px on touch widths, 36px from md: rows stay compact on desktop without
// shrinking the tap target on a phone.
const rowActionClass =
  "size-11 text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text md:size-9";

// Icon-only row action: the label is both its accessible name and the hover
// hint, since the table has no room for a text button per row.
export const OpsRowActionButton = ({
  className,
  icon: Icon,
  label,
  ...props
}: ComponentProps<typeof Button> & RowActionProps) => (
  <Button
    aria-label={label}
    className={cn(rowActionClass, className)}
    size="icon"
    title={label}
    type="button"
    variant="ghost"
    {...props}
  >
    <Icon />
  </Button>
);

export const OpsRowActionLink = ({
  className,
  href,
  icon: Icon,
  label,
}: RowActionProps & { className?: string; href: string }) => (
  <Button asChild className={cn(rowActionClass, className)} size="icon" variant="ghost">
    <Link aria-label={label} href={href} title={label}>
      <Icon />
    </Link>
  </Button>
);

export const OpsRowActions = ({ children }: { children: ReactNode }) => (
  <div className="flex items-center justify-end gap-0.5">{children}</div>
);

// Below sm the amount and actions columns are hidden; this block shows them at
// the end of the first cell instead, so a row fits a phone without scrolling.
export const OpsRowMobileAside = ({
  actions,
  value,
}: {
  actions?: ReactNode;
  value: ReactNode;
}) => (
  <div className="flex shrink-0 flex-col items-end gap-1 sm:hidden">
    <div className="tabular-nums">{value}</div>
    {actions ? <OpsRowActions>{actions}</OpsRowActions> : null}
  </div>
);

// The slice of useOpsTableState the pager reads; the hook's result fits it.
export type OpsTablePageState = {
  pageCount: number;
  pageIndex: number;
  rangeEnd: number;
  rangeStart: number;
  setPageIndex: (index: number) => void;
  total: number;
};

// Footer of an ops table: a summary on the left (count and total) and, only
// when there is more than one page, the pager on the right.
export const OpsTablePagination = ({
  label,
  page: { pageCount, pageIndex, rangeEnd, rangeStart, setPageIndex, total },
  summary,
}: {
  label: string;
  page: OpsTablePageState;
  summary?: ReactNode;
}) => {
  const rootRef = useRef<HTMLDivElement>(null);

  if (!summary && pageCount <= 1) return null;

  // The pager sits under the rows: after a long page the next one starts
  // above the viewport, so bring the table's top edge back into view. The
  // table's scroll-margin is the room the sticky top bar takes.
  const goToPage = (index: number) => {
    setPageIndex(index);
    const table = rootRef.current?.closest<HTMLElement>("[data-slot='ops-data-table']");
    if (!table) return;
    const topOffset = Number.parseFloat(getComputedStyle(table).scrollMarginTop) || 0;
    if (table.getBoundingClientRect().top < topOffset) {
      table.scrollIntoView({ block: "start" });
    }
  };

  return (
    <div
      className="flex flex-col gap-2 border-t border-ops-border px-3 py-2.5 text-sm text-ops-text-muted sm:flex-row sm:items-center sm:justify-between"
      ref={rootRef}
    >
      <div className="min-w-0">{summary}</div>
      {pageCount > 1 ? (
        <nav aria-label={label} className="flex items-center justify-between gap-3 sm:justify-end">
          <span aria-live="polite" className="tabular-nums">
            {rangeStart}–{rangeEnd} de {total}
          </span>
          <div className="flex gap-2">
            <Button
              className="min-h-11 md:min-h-8"
              disabled={pageIndex === 0}
              onClick={() => goToPage(pageIndex - 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              <ChevronLeft />
              Anterior
            </Button>
            <Button
              className="min-h-11 md:min-h-8"
              disabled={pageIndex >= pageCount - 1}
              onClick={() => goToPage(pageIndex + 1)}
              size="sm"
              type="button"
              variant="outline"
            >
              Siguiente
              <ChevronRight />
            </Button>
          </div>
        </nav>
      ) : null}
    </div>
  );
};

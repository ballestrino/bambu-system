"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import { BriefcaseBusiness, MessageSquareText, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { WebFormFilters } from "@/components/web-forms/web-forms-toolbar";
import type { listWebFormsAction } from "@/components/web-forms/actions/web-forms.action";
import { formatWebFormDate } from "@/components/web-forms/web-form-dates";
import { WEB_FORM_KIND_LABELS } from "@/lib/web-forms/labels";
import { cn } from "@/lib/utils";

type ListData = Awaited<ReturnType<typeof listWebFormsAction>>;
type Row = ListData["rows"][number];

const EMPTY_TEXT: Record<WebFormFilters["status"], string> = {
  NEW: "No hay formularios nuevos. Los que lleguen desde la web aparecen acá.",
  REPLIED: "Todavía no respondiste ninguno.",
  ARCHIVED: "No hay formularios archivados.",
  ALL: "Todavía no llegó ningún formulario desde la web.",
};

function WebFormRow({ row, selected, onSelect }: { row: Row; selected: boolean; onSelect: () => void }) {
  const unread = !row.readAt;
  const Icon = row.kind === "JOB_APPLICATION" ? BriefcaseBusiness : MessageSquareText;
  const subtitle = row.kind === "CONTACT" ? [row.service, row.location].filter(Boolean).join(" · ") : WEB_FORM_KIND_LABELS.JOB_APPLICATION;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "true" : undefined}
        className={cn(
          "flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-ops-surface-muted focus-visible:bg-ops-surface-muted focus-visible:outline-none",
          selected && "bg-ops-bamboo-soft hover:bg-ops-bamboo-soft"
        )}
      >
        <span className="relative mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-ops-surface-muted text-ops-bamboo-strong">
          <Icon className="size-4" aria-hidden />
          {unread && (
            <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-ops-bamboo ring-2 ring-ops-surface" aria-label="Sin leer" />
          )}
        </span>
        <span className="min-w-0 flex-1 space-y-0.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className={cn("truncate text-sm text-ops-text", unread ? "font-semibold" : "font-medium")}>{row.name}</span>
            <span className="shrink-0 text-xs tabular-nums text-ops-text-muted">{formatWebFormDate(row.createdAt)}</span>
          </span>
          <span className="block truncate text-xs text-ops-text-muted">{subtitle || row.email}</span>
          <span className="line-clamp-2 text-sm text-ops-text-muted">
            {row.message || (row.cvFilename ? "Sin mensaje, con CV adjunto" : "Sin mensaje")}
          </span>
          {(row.cvFilename || row.replyCount > 0 || row.fromTrebol) && (
            <span className="flex flex-wrap gap-2 pt-1 text-xs text-ops-text-muted">
              {row.cvFilename && (
                <span className="inline-flex items-center gap-1">
                  <Paperclip className="size-3" aria-hidden /> CV
                </span>
              )}
              {row.replyCount > 0 && <span>{row.replyCount === 1 ? "1 respuesta" : `${row.replyCount} respuestas`}</span>}
              {row.fromTrebol && <span>El Trébol</span>}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

export function WebFormList({
  query,
  selectedId,
  onSelect,
  filters,
}: {
  query: UseQueryResult<ListData, Error>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: WebFormFilters;
}) {
  if (query.isPending) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Cargando formularios">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/40 dark:bg-red-500/15 dark:text-red-200">
        <span>{query.error.message}</span>
        <Button variant="outline" className="h-11 sm:h-9" onClick={() => query.refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }
  const rows = query.data.rows;
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-ops-border px-4 py-10 text-center text-sm text-ops-text-muted">
        {filters.search || filters.kind !== "ALL" ? "Ningún formulario coincide con el filtro." : EMPTY_TEXT[filters.status]}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-ops-border overflow-hidden rounded-xl border border-ops-border bg-ops-surface">
      {rows.map((row) => (
        <WebFormRow key={row.id} row={row} selected={row.id === selectedId} onSelect={() => onSelect(row.id)} />
      ))}
    </ul>
  );
}

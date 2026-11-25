"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown } from "lucide-react";

import { plural } from "@/lib/ops/visit-day";
import { JobsCheckbox } from "@/components/ops/jobs/jobs-checkbox";
import { opsAttention } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { PendingRow, pendingGridClass, type PendingRowAction } from "@/components/ops/visits/pending/pending-row";
import { PendingWeekdayChips } from "@/components/ops/visits/pending/pending-weekday-chips";
import type { PendingView } from "@/components/ops/visits/pending/use-pending-view";
import { cn } from "@/lib/utils";

const moreButton = "h-10 rounded-[9px] px-2 text-[13px] font-semibold text-ops-bamboo-strong hover:bg-ops-surface-muted";

// Pendientes agrupadas por trabajo: cabecera con casilla del grupo, cuantas
// son y como vienen; las primeras filas y "Mostrar" para el resto.
export const PendingGroupList = ({
  isBusy,
  jobScoped,
  onAction,
  todayKey,
  view,
}: {
  isBusy: boolean;
  jobScoped: boolean;
  onAction: (visit: OpsOccurrence, action: PendingRowAction) => void;
  todayKey: string;
  view: PendingView;
}) => (
  <section aria-label={jobScoped ? "Pendientes de este trabajo" : "Pendientes agrupadas por trabajo"} className="overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
    <div className={cn(pendingGridClass, "bg-ops-surface-muted/60 py-0.5 pr-3 pl-1 text-xs font-semibold text-ops-text-muted @3xl/pending:pr-4")}>
      <label className="flex size-11 cursor-pointer items-center justify-center">
        <JobsCheckbox checked={view.allCheck} label="Seleccionar todas las pendientes que se ven" onCheckedChange={view.toggleAll} />
      </label>
      <span className="@3xl/pending:hidden">{plural(view.filtered.length, "pendiente")}</span>
      <span className="hidden @3xl/pending:block">Fecha</span>
      <span className="hidden @3xl/pending:block">Programado</span>
      <span className="hidden @3xl/pending:block">Equipo</span>
      <span className="hidden @3xl/pending:block">Antigüedad</span>
      {!jobScoped ? <span className="flex justify-end">
        <button
          className="inline-flex h-9 items-center gap-1.5 rounded-[9px] px-2.5 text-[12.5px] font-semibold text-ops-text hover:bg-ops-surface"
          onClick={() => view.setAllOpen(!view.anyOpen)}
          type="button"
        >
          {view.anyOpen ? <ChevronsDownUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
          {view.anyOpen ? "Contraer todo" : "Expandir todo"}
        </button>
      </span> : null}
    </div>

    {view.visibleGroups.map((group, index) => {
      const open = view.isOpen(group, index);
      const rows = view.rowsOf(group);
      const rest = group.visits.length - rows.length;
      const hiddenSelected = view.hiddenSelected(group);

      return (
        <div key={group.jobId}>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-t border-ops-border bg-ops-surface-muted/40 py-1.5 pr-3 pl-1 @3xl/pending:pr-4">
            <label className="flex size-11 cursor-pointer items-center justify-center">
              <JobsCheckbox checked={view.groupCheck(group)} label={`Seleccionar las ${group.visits.length} de ${group.name}`} onCheckedChange={() => view.toggleGroup(group)} />
            </label>
            <button
              aria-expanded={open}
              aria-label={`${open ? "Contraer" : "Expandir"} ${group.name}`}
              className="flex size-8 items-center justify-center rounded-lg text-ops-text-muted hover:bg-ops-surface"
              onClick={() => view.toggleOpen(group, index)}
              type="button"
            >
              {open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            </button>
            <h3 className="text-[15px] font-semibold text-ops-text">{group.name}</h3>
            <span className={cn("inline-flex h-[22px] items-center rounded-full border px-2 text-[11.5px] font-semibold", opsAttention.chip)}>
              {plural(group.visits.length, "pendiente")}
            </span>
            <span className="min-w-0 flex-[1_1_220px] text-[12.5px] text-ops-text-muted">{group.meta}</span>
            {!jobScoped ? (
              <Link className="text-[13px] font-semibold text-ops-bamboo-strong underline-offset-[3px] hover:underline" href={`/dashboard/jobs/${group.jobId}`}>
                Ver trabajo
              </Link>
            ) : null}
          </div>
          {open ? (
            <>
              {group.visits.length > 1 ? (
                <PendingWeekdayChips check={view.idsCheck} jobName={group.name} onToggle={view.toggleIds} weekdays={view.weekdaysOf(group)} />
              ) : null}
              {rows.map((visit) => (
                <PendingRow
                  isBusy={isBusy}
                  key={visit.id}
                  onAction={onAction}
                  onToggle={() => view.toggle(visit.id)}
                  selected={view.isSelected(visit.id)}
                  todayKey={todayKey}
                  visit={visit}
                />
              ))}
              {rest > 0 ? (
                <div className="border-t border-ops-surface-muted py-1 pl-14">
                  <button className={moreButton} onClick={() => view.showAllRows(group.jobId)} type="button">
                    Mostrar {rest === 1 ? "la otra" : `las otras ${rest}`}
                    {hiddenSelected === rest
                      ? ` (${rest === 1 ? "también seleccionada" : "también seleccionadas"})`
                      : hiddenSelected
                        ? ` (${hiddenSelected} ${hiddenSelected === 1 ? "seleccionada" : "seleccionadas"})`
                        : ""}
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      );
    })}

    {view.hiddenGroups ? (
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ops-border px-4 py-3 text-[13px] text-ops-text-muted">
        <span>Mostrando {view.visibleGroups.length} de {view.visibleGroups.length + view.hiddenGroups} trabajos</span>
        <button className="h-10 rounded-[10px] border border-ops-border bg-ops-surface px-3 text-[13px] font-semibold text-ops-text hover:bg-ops-surface-muted" onClick={view.showAllGroups} type="button">
          Ver los {view.hiddenGroups} restantes
        </button>
      </div>
    ) : null}
  </section>
);

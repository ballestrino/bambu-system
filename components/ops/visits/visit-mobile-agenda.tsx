"use client";

import { CircleCheck, X } from "lucide-react";

import { formatMinuteOfDay } from "@/lib/ops/minute-ranges";
import { buildDayColumns, formatHours, getVisitMinutes, getVisitTitle, plural } from "@/lib/ops/visit-day";
import { opsAttention } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitAvatar, VisitLoadBar } from "@/components/ops/visits/visit-bits";
import { VisitDayStates } from "@/components/ops/visits/visit-day-states";
import { getVisitAction, getVisitPartners, getVisitSubline } from "@/components/ops/visits/visit-view-model";
import { cn } from "@/lib/utils";

const VisitMobileRow = ({ ctrl, employeeId, visit }: { ctrl: VisitsController; employeeId: string | null; visit: OpsOccurrence }) => {
  const { endMinute, startMinute } = getVisitMinutes(visit);
  const action = getVisitAction(visit);
  const ActionIcon = action.icon;
  const partners = employeeId ? getVisitPartners(visit, employeeId) : null;
  const subline = getVisitSubline(visit);

  return (
    <div
      className={cn("flex min-h-[66px] cursor-pointer items-center gap-3 border-t border-ops-surface-muted py-2 pr-3 pl-3.5 active:bg-ops-canvas", visit.status === "SKIPPED" || visit.status === "CANCELED" ? "opacity-80" : null)}
      onClick={() => ctrl.select(visit)}
    >
      <div className="flex w-[46px] shrink-0 flex-col tabular-nums">
        <span className="text-[14.5px] font-semibold text-ops-text">{formatMinuteOfDay(startMinute)}</span>
        <span className="text-[12.5px] text-ops-text-muted">{formatMinuteOfDay(endMinute)}</span>
      </div>
      <button className="flex min-w-0 flex-1 flex-col gap-0.5 text-left" type="button">
        <span className="truncate text-[15px] font-semibold text-ops-text">{getVisitTitle(visit)}</span>
        <span
          className={cn(
            "truncate text-[12.5px]",
            visit.status === "SKIPPED" || visit.status === "CANCELED" ? opsAttention.text : visit.actualStartAt ? "text-emerald-800 dark:text-emerald-200" : "text-ops-text-muted"
          )}
        >
          {partners ? `${partners} · ${subline}` : subline}
        </span>
      </button>
      {action.kind !== "editar" ? (
        <button
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-ops-bamboo-strong px-3.5 text-sm font-semibold text-white dark:text-ops-canvas"
          onClick={(event) => {
            event.stopPropagation();
            ctrl.act(visit, action.kind);
          }}
          type="button"
        >
          <ActionIcon className="size-4" />
          {action.short}
        </button>
      ) : visit.status === "DONE" ? (
        <CircleCheck aria-label="Realizada" className="mr-2 size-6 shrink-0 text-emerald-500" />
      ) : visit.status === "SKIPPED" || visit.status === "CANCELED" ? (
        <span className={cn("inline-flex h-[26px] items-center rounded-full border px-2.5 text-xs font-semibold", opsAttention.chip)}>
          {visit.status === "SKIPPED" ? "Omitida" : "Cancelada"}
        </span>
      ) : null}
    </div>
  );
};

// Agenda del celular (2a): una tarjeta por empleada con sus visitas del dia,
// "Sin asignar" primero y en ambar.
export const VisitMobileAgenda = ({ ctrl }: { ctrl: VisitsController }) => {
  const { content, desk } = ctrl;
  const groups = buildDayColumns(content.visits, ctrl.data.employees).filter((column) => column.visits.length);

  return (
    <div className="flex flex-col gap-3 px-1">
      {desk.filters.attentionOnly ? (
        <button
          className={cn("inline-flex h-9 items-center gap-1.5 self-start rounded-full border pr-2 pl-3 text-[13.5px] font-semibold", opsAttention.chip)}
          onClick={content.onToggleAttention}
          type="button"
        >
          Solo requieren atención
          <X className="size-[15px]" />
        </button>
      ) : null}
      {content.body !== "list" ? (
        <div className="flex min-h-[320px] flex-col rounded-[18px] border border-ops-border bg-ops-surface">
          <VisitDayStates ctrl={ctrl} />
        </div>
      ) : (
        groups.map((group) => (
          <section
            className={cn(
              "overflow-hidden rounded-[18px] border",
              group.employeeId ? "border-ops-border bg-ops-surface" : cn(opsAttention.card, "bg-ops-surface")
            )}
            key={group.employeeId ?? "unassigned"}
          >
            <header className="flex items-center gap-2.5 px-3.5 py-3">
              <VisitAvatar className="size-[34px] text-xs" name={group.name} unassigned={!group.employeeId} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-[15.5px] font-semibold text-ops-text">{group.name}</span>
                <span className="text-[12.5px] text-ops-text-muted">
                  {group.employeeId
                    ? `${plural(group.visits.length, "visita")} · ${formatHours(group.minutes)} hoy`
                    : `${plural(group.visits.length, "visita")} por asignar`}
                </span>
              </div>
              {group.employeeId ? <VisitLoadBar className="w-14 h-1.5" max={8} minutes={group.minutes} /> : null}
            </header>
            {group.visits.map((visit) => (
              <VisitMobileRow ctrl={ctrl} employeeId={group.employeeId} key={`${group.employeeId}-${visit.id}`} visit={visit} />
            ))}
          </section>
        ))
      )}
    </div>
  );
};

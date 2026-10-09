"use client";

import { ArrowRight, ChevronDown, UsersRound } from "lucide-react";

import { getWeekDays } from "@/lib/ops/visit-calendar";
import { formatHours, plural } from "@/lib/ops/visit-day";
import { opsVisitBlock } from "@/components/ops/shared";
import type { MobileSchedule } from "@/components/ops/visits/hooks/use-mobile-schedule";
import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";
import { VisitAvatar } from "@/components/ops/visits/visit-bits";
import { cn } from "@/lib/utils";

// Cronograma del celular (2a): los dias quedan fijos a la izquierda y las
// empleadas elegidas se deslizan a la derecha, una columna por pantalla media.
export const VisitMobileSchedule = ({
  ctrl,
  onOpenPicker,
  schedule,
}: {
  ctrl: VisitsController;
  onOpenPicker: () => void;
  schedule: MobileSchedule;
}) => {
  const days = getWeekDays(ctrl.desk.dayKey);
  const rowHeight = (index: number) =>
    Math.max(1, ...schedule.visible.map((column) => column.days[index]?.visits.length ?? 0)) * 50 + 14;
  const names = schedule.visible.map((column) => column.name.split(" ")[0]).join(", ");

  return (
    <div className="flex flex-col gap-1">
      <button
        className="mx-1 flex h-[46px] items-center gap-2.5 rounded-[13px] border border-ops-border bg-ops-surface pr-3 pl-3.5"
        onClick={onOpenPicker}
        type="button"
      >
        <UsersRound className="size-[18px] text-ops-bamboo-strong" />
        <span className="flex min-w-0 flex-1 flex-col text-left">
          <span className="text-[15px] font-semibold whitespace-nowrap text-ops-text">
            {schedule.all ? "Todas las empleadas" : `${schedule.picks.length} de ${schedule.columns.length} en la comparación`}
          </span>
          <span className="truncate text-xs text-ops-text-muted">{names}</span>
        </span>
        <ChevronDown className="size-[18px] text-ops-text-muted" />
      </button>
      {schedule.visible.length > 2 ? (
        <span className="flex items-center justify-end gap-1 px-1 text-[11.5px] whitespace-nowrap text-ops-text-muted">
          Deslizá para ver las {schedule.visible.length} columnas
          <ArrowRight className="size-[13px]" />
        </span>
      ) : null}
      <div className="-mx-4 mt-1 snap-x snap-mandatory overflow-x-auto border-t border-ops-border bg-ops-surface">
        <div className="flex w-max">
          <div className="sticky left-0 z-[3] w-11 shrink-0 border-r border-ops-surface-muted bg-ops-surface">
            <div className="h-14 border-b border-ops-border" />
            {days.map((day, index) => (
              <div
                className={cn("flex flex-col items-center border-b border-ops-surface-muted pt-2.5", day.dayKey === ctrl.desk.todayKey && "bg-ops-bamboo-soft")}
                key={day.dayKey}
                style={{ height: rowHeight(index) }}
              >
                <span className="text-[11px] font-semibold text-ops-text-muted">{day.weekdayLetter}</span>
                <span className={cn("text-[15px] font-semibold tabular-nums", day.dayKey === ctrl.desk.todayKey ? "text-ops-bamboo-strong" : "text-ops-text")}>{day.day}</span>
              </div>
            ))}
          </div>
          {schedule.visible.map((column) => (
            <div
              className={cn("w-[173px] shrink-0 snap-start scroll-ml-11 border-r border-ops-surface-muted", column.unassigned && "bg-amber-50/40 dark:bg-amber-500/5")}
              key={column.id}
            >
              <div className="flex h-14 items-center gap-2 border-b border-ops-border px-2.5">
                <VisitAvatar name={column.name} unassigned={column.unassigned} />
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-semibold text-ops-text">{column.unassigned ? "Sin asignar" : column.name.split(" ")[0]}</span>
                  <span className="text-[11.5px] whitespace-nowrap text-ops-text-muted">
                    {formatHours(column.minutes)} · {plural(column.total, "visita")}
                  </span>
                </div>
              </div>
              {column.days.map((day, index) => (
                <div
                  className="flex flex-col gap-1 overflow-hidden border-b border-ops-surface-muted p-1.5"
                  key={day.dateKey}
                  style={{ height: rowHeight(index) }}
                >
                  {day.visits.map((visit) => {
                    const look = column.unassigned ? opsVisitBlock.unassigned : opsVisitBlock[visit.status];
                    return (
                      <button
                        className={cn("flex flex-col rounded-[9px] border border-l-[3px] px-[7px] py-[5px] text-left", look.block, look.bar)}
                        key={visit.id}
                        onClick={() => ctrl.desk.open(visit.id, column.unassigned ? "asignar" : "detalle")}
                        type="button"
                      >
                        <span className={cn("text-[11px] font-semibold whitespace-nowrap tabular-nums", look.time)}>
                          {visit.startLabel}–{visit.endLabel}
                        </span>
                        <span className="truncate text-[12.5px] font-medium text-ops-text">{visit.displayName}</span>
                      </button>
                    );
                  })}
                  {day.visits.length ? null : (
                    <span className="p-1 text-xs text-ops-text-muted/70">{column.unassigned ? "—" : "Libre"}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

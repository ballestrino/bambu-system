"use client";

import { Check } from "lucide-react";

import { formatHours, plural } from "@/lib/ops/visit-day";
import type { MobileSchedule } from "@/components/ops/visits/hooks/use-mobile-schedule";
import { VisitAvatar } from "@/components/ops/visits/visit-bits";
import { VisitSheet } from "@/components/ops/visits/visit-sheet";
import { cn } from "@/lib/utils";

const Box = ({ on }: { on: boolean }) =>
  on ? (
    <span className="flex size-[26px] items-center justify-center rounded-lg bg-ops-bamboo-strong text-white dark:text-ops-canvas">
      <Check className="size-4" strokeWidth={3} />
    </span>
  ) : (
    <span className="size-[26px] rounded-lg border-2 border-ops-border bg-ops-surface" />
  );

// "Empleadas en el cronograma": quienes entran como columnas en el celular.
export const VisitEmployeePickerSheet = ({
  onOpenChange,
  open,
  schedule,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  schedule: MobileSchedule;
}) => (
  <VisitSheet
    description="Marcá a quiénes querés comparar."
    footer={
      <button
        className="h-[52px] w-full rounded-[14px] bg-ops-bamboo-strong text-base font-semibold text-white dark:text-ops-canvas"
        onClick={() => onOpenChange(false)}
        type="button"
      >
        Ver {plural(schedule.picks.length, "columna")}
      </button>
    }
    onOpenChange={onOpenChange}
    open={open}
    title="Empleadas en el cronograma"
  >
    <div className="flex flex-col gap-1.5 px-4 pb-3">
      <button className="flex min-h-14 items-center gap-3 rounded-[14px] bg-ops-canvas px-3.5 dark:bg-ops-surface-muted" onClick={schedule.setAll} type="button">
        <span className="flex-1 text-left text-base font-semibold text-ops-text">Todas</span>
        <Box on={schedule.all} />
      </button>
      {schedule.columns.map((column) => {
        const on = schedule.picks.includes(column.id);
        return (
          <button
            aria-pressed={on}
            className={cn("flex min-h-[60px] items-center gap-3 rounded-[14px] border px-3.5", on ? "border-ops-bamboo bg-ops-bamboo-soft/40" : "border-ops-border bg-ops-surface")}
            key={column.id}
            onClick={() => schedule.toggle(column.id)}
            type="button"
          >
            <VisitAvatar className="size-[34px] text-xs" name={column.name} unassigned={column.unassigned} />
            <span className="flex min-w-0 flex-1 flex-col text-left">
              <span className="text-[15.5px] font-semibold text-ops-text">{column.name}</span>
              <span className="text-[13px] whitespace-nowrap text-ops-text-muted">
                {column.unassigned
                  ? `${plural(column.total, "visita")} por asignar`
                  : `${plural(column.total, "visita")} · ${formatHours(column.minutes)} esta semana`}
              </span>
            </span>
            <Box on={on} />
          </button>
        );
      })}
    </div>
  </VisitSheet>
);

"use client";

import { formatMinuteOfDay } from "@/lib/ops/minute-ranges";
import {
  buildDayColumns,
  formatHours,
  getNowLineTop,
  plural,
  TIME_GRID_END_HOUR,
  TIME_GRID_START_HOUR,
} from "@/lib/ops/visit-day";
import type { OpsOccurrence } from "@/components/ops/types";
import { VisitAvatar } from "@/components/ops/visits/visit-bits";
import { VisitTimeBlock } from "@/components/ops/visits/visit-time-block";
import type { VisitActionKind } from "@/components/ops/visits/visit-view-model";
import { cn } from "@/lib/utils";

const HOUR_PX = 46;
const HOURS = Array.from(
  { length: TIME_GRID_END_HOUR - TIME_GRID_START_HOUR + 1 },
  (_, index) => TIME_GRID_START_HOUR + index
);
const GRID_HEIGHT = (TIME_GRID_END_HOUR - TIME_GRID_START_HOUR) * HOUR_PX;

// Grilla de 07 a 20 con una columna por empleada y "Sin asignar" primero.
export const VisitTimeGrid = ({
  employees,
  now,
  onAction,
  onOpen,
  selectedId,
  visits,
}: {
  employees: { id: string; name: string }[];
  now: Date | null;
  onAction: (visit: OpsOccurrence, kind: VisitActionKind) => void;
  onOpen: (visit: OpsOccurrence) => void;
  selectedId: string | null;
  visits: OpsOccurrence[];
}) => {
  const columns = buildDayColumns(visits, employees);
  const template = { gridTemplateColumns: `52px repeat(${columns.length}, minmax(168px, 1fr))` };
  const minWidth = 52 + columns.length * 168;
  const nowTop = now ? getNowLineTop(now, HOUR_PX) : null;

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div className="sticky top-0 z-[3] grid border-b border-ops-border bg-ops-surface" style={{ ...template, minWidth }}>
        <span className="sticky left-0 z-[1] bg-ops-surface" />
        {columns.map((column) => (
          <div
            className={cn("flex items-center gap-2 border-l border-ops-surface-muted p-2.5", !column.employeeId && "bg-amber-50/40 dark:bg-amber-500/5")}
            key={column.employeeId ?? "unassigned"}
          >
            <VisitAvatar name={column.name} unassigned={!column.employeeId} />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-semibold text-ops-text">{column.name}</span>
              <span className="text-[11.5px] whitespace-nowrap text-ops-text-muted">
                {column.visits.length ? `${plural(column.visits.length, "visita")} · ${formatHours(column.minutes)}` : "Libre"}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="relative grid" style={{ ...template, minWidth }}>
        <div className="sticky left-0 z-[2] bg-ops-surface" style={{ height: GRID_HEIGHT }}>
          {HOURS.map((hour, index) => (
            <span
              className="absolute right-2 bg-ops-surface px-0.5 text-[11px] whitespace-nowrap text-ops-text-muted tabular-nums"
              key={hour}
              style={{ top: index * HOUR_PX, transform: index ? "translateY(-50%)" : "translateY(2px)" }}
            >
              {formatMinuteOfDay(hour * 60)}
            </span>
          ))}
        </div>
        {columns.map((column) => (
          <div
            className={cn("relative border-l border-ops-surface-muted", !column.employeeId && "bg-amber-50/40 dark:bg-amber-500/5")}
            key={column.employeeId ?? "unassigned"}
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, var(--ops-surface-muted) 0, var(--ops-surface-muted) 1px, transparent 1px, transparent ${HOUR_PX}px)`,
              height: GRID_HEIGHT,
            }}
          >
            {column.visits.map((visit) => (
              <VisitTimeBlock
                employeeId={column.employeeId}
                hourPx={HOUR_PX}
                key={visit.id}
                onAction={(kind) => onAction(visit, kind)}
                onOpen={() => onOpen(visit)}
                selected={visit.id === selectedId}
                visit={visit}
              />
            ))}
          </div>
        ))}
        {nowTop !== null ? (
          <div className="pointer-events-none absolute right-0 left-[46px] z-[2] border-t-2 border-[#C0392B]" style={{ top: nowTop }}>
            <span className="absolute -top-[5px] left-0 size-2 rounded-full bg-[#C0392B]" />
          </div>
        ) : null}
      </div>
    </div>
  );
};

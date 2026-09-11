"use client";

import { useState } from "react";
import { CalendarRange, UsersRound } from "lucide-react";

import { DAY_MINUTES, formatMinuteOfDay } from "@/lib/ops/minute-ranges";
import type { ScheduleVisit } from "@/lib/ops/schedule-types";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { ScheduleAvailabilityDialog } from "@/components/ops/schedules/schedule-availability-dialog";
import {
  ScheduleGapFinder,
  type ScheduleGapPick,
} from "@/components/ops/schedules/schedule-gap-finder";
import {
  ScheduleGrid,
  ScheduleList,
  toScheduleRow,
} from "@/components/ops/schedules/schedule-grid";
import { ScheduleToolbar } from "@/components/ops/schedules/schedule-toolbar";
import { ScheduleUnassignedRow } from "@/components/ops/schedules/schedule-unassigned-row";
import { useScheduleCells } from "@/components/ops/schedules/use-schedule-cells";
import { useScheduleDrag } from "@/components/ops/schedules/use-schedule-drag";
import { useScheduleVisitMove } from "@/components/ops/schedules/use-schedule-visit-move";
import { useScheduleWeek } from "@/components/ops/schedules/use-schedule-week";
import { OpsEmptyState, OpsRecordSkeleton } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { toDateTimeLocalValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";

type DialogState =
  | { defaults: { employeeIds: string[]; scheduledEndAt: string; scheduledStartAt: string }; mode: "create" }
  | { mode: "edit"; occurrence: OpsOccurrence };

type PanelState = "availability" | "gaps" | null;

// El input datetime-local no acepta 24:00, asi que un hueco que termina a la
// medianoche cierra un minuto antes.
const toLocalValue = (dateKey: string, minute: number) =>
  `${dateKey}T${formatMinuteOfDay(Math.min(minute, DAY_MINUTES - 1))}`;

export const ScheduleBoard = () => {
  const state = useScheduleWeek();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [panel, setPanel] = useState<PanelState>(null);
  const moveVisit = useScheduleVisitMove(state.occurrences);
  const drag = useScheduleDrag(moveVisit);
  const cells = useScheduleCells({
    dragging: drag.dragging,
    rules: state.availabilityRules,
    schedule: state.schedule,
    visibleWeekdays: state.visibleWeekdays,
  });

  const openCreate = (dateKey: string, employeeId: string | null) =>
    setDialog({
      defaults: {
        employeeIds: employeeId ? [employeeId] : [],
        scheduledEndAt: toDateTimeLocalValue(new Date(`${dateKey}T13:00:00`)),
        scheduledStartAt: toDateTimeLocalValue(new Date(`${dateKey}T09:00:00`)),
      },
      mode: "create",
    });

  const openCreateInGap = (pick: ScheduleGapPick) => {
    setPanel(null);
    setDialog({
      defaults: {
        employeeIds: [pick.employeeId],
        scheduledEndAt: toLocalValue(pick.dateKey, pick.endMinute),
        scheduledStartAt: toLocalValue(pick.dateKey, pick.startMinute),
      },
      mode: "create",
    });
  };

  const openEdit = (visit: ScheduleVisit) => {
    const occurrence = state.occurrences.find((current) => current.id === visit.id);
    if (occurrence) setDialog({ mode: "edit", occurrence });
  };

  const handlers = {
    drag,
    getCellState: cells.getCellState,
    onCreate: openCreate,
    onEditVisit: openEdit,
  };
  const rows = state.schedule.employees.map((employee) =>
    toScheduleRow(employee, state.visibleWeekdays)
  );

  return (
    <div className="space-y-3">
      <ScheduleToolbar
        employeeOptions={state.employeeOptions}
        onEmployeesChange={state.setSelectedEmployeeIds}
        onOpenAvailability={() => setPanel("availability")}
        onOpenGaps={() => setPanel("gaps")}
        onWeekChange={state.setWeekStart}
        onWeekdaysChange={state.setVisibleWeekdays}
        overlapCount={cells.overlapCount}
        schedule={state.schedule}
        selectedEmployeeIds={state.selectedEmployeeIds}
        visibleWeekdays={state.visibleWeekdays}
        weekLabel={state.schedule.weekLabel}
        weekStart={state.weekStart}
      />

      {state.isLoading ? <OpsRecordSkeleton /> : null}

      {state.error && !state.isLoading ? (
        <OpsEmptyState
          action={
            <Button onClick={() => state.refetch()} size="sm" type="button" variant="outline">
              Reintentar
            </Button>
          }
          description="No pudimos cargar el cronograma de esta semana."
          icon={CalendarRange}
          title="Error al cargar"
        />
      ) : null}

      {!state.isLoading && !state.error ? (
        rows.length ? (
          <>
            <ScheduleUnassignedRow
              handlers={handlers}
              schedule={state.schedule}
              visibleWeekdays={state.visibleWeekdays}
            />
            <ScheduleGrid
              handlers={handlers}
              rows={rows}
              schedule={state.schedule}
              visibleWeekdays={state.visibleWeekdays}
            />
            <ScheduleList
              handlers={handlers}
              rows={rows}
              schedule={state.schedule}
              visibleWeekdays={state.visibleWeekdays}
            />
          </>
        ) : (
          <OpsEmptyState
            description="Activá empleadas o limpiá el filtro para ver el cronograma."
            icon={UsersRound}
            title="No hay empleadas para mostrar"
          />
        )
      ) : null}

      <ScheduleGapFinder
        onOpenChange={(open) => setPanel(open ? "gaps" : null)}
        onPick={openCreateInGap}
        open={panel === "gaps"}
        rules={state.availabilityRules}
        schedule={state.schedule}
        visibleWeekdays={state.visibleWeekdays}
      />

      <ScheduleAvailabilityDialog
        employeeOptions={state.employeeOptions}
        onOpenChange={(open) => setPanel(open ? "availability" : null)}
        open={panel === "availability"}
      />

      {dialog ? (
        <JobOccurrenceDialog
          defaults={dialog.mode === "create" ? dialog.defaults : undefined}
          key={dialog.mode === "edit" ? dialog.occurrence.id : "create"}
          occurrence={dialog.mode === "edit" ? dialog.occurrence : undefined}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          open
        />
      ) : null}
    </div>
  );
};

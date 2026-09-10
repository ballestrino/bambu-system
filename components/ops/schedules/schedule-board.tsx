"use client";

import { useState } from "react";
import { CalendarRange, UsersRound } from "lucide-react";

import { shiftOccurrenceToDate } from "@/lib/ops/schedule-week";
import type { ScheduleVisit } from "@/lib/ops/schedule-types";
import { useJobOccurrenceMutations } from "@/components/ops/hooks/useJobOccurrenceMutations";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import {
  ScheduleGrid,
  ScheduleList,
  toScheduleRow,
} from "@/components/ops/schedules/schedule-grid";
import { ScheduleToolbar } from "@/components/ops/schedules/schedule-toolbar";
import { ScheduleUnassignedRow } from "@/components/ops/schedules/schedule-unassigned-row";
import {
  useScheduleDrag,
  type ScheduleDragPayload,
} from "@/components/ops/schedules/use-schedule-drag";
import { useScheduleWeek } from "@/components/ops/schedules/use-schedule-week";
import { OpsEmptyState, OpsRecordSkeleton } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { toDateTimeLocalValue } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";

type DialogState =
  | { defaults: { employeeIds: string[]; scheduledEndAt: string; scheduledStartAt: string }; mode: "create" }
  | { mode: "edit"; occurrence: OpsOccurrence };

export const ScheduleBoard = () => {
  const state = useScheduleWeek();
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const { updateOccurrenceAsync } = useJobOccurrenceMutations();

  const findOccurrence = (visitId: string) =>
    state.occurrences.find((occurrence) => occurrence.id === visitId);

  const openCreate = (dateKey: string, employeeId: string | null) => {
    const start = new Date(`${dateKey}T09:00:00`);
    const end = new Date(`${dateKey}T13:00:00`);

    setDialog({
      defaults: {
        employeeIds: employeeId ? [employeeId] : [],
        scheduledEndAt: toDateTimeLocalValue(end),
        scheduledStartAt: toDateTimeLocalValue(start),
      },
      mode: "create",
    });
  };
  const openEdit = (visit: ScheduleVisit) => {
    const occurrence = findOccurrence(visit.id);
    if (occurrence) setDialog({ mode: "edit", occurrence });
  };

  const moveVisit = (payload: ScheduleDragPayload, targetDateKey: string) => {
    const occurrence = findOccurrence(payload.visitId);
    const shifted = occurrence && shiftOccurrenceToDate(occurrence, targetDateKey);
    if (!occurrence || !shifted) return;

    void updateOccurrenceAsync({
      occurrenceId: occurrence.id,
      successMessage: "Visita movida",
      values: shifted,
    }).catch(() => undefined);
  };

  const drag = useScheduleDrag(moveVisit);
  const handlers = { drag, onCreate: openCreate, onEditVisit: openEdit };
  const rows = state.schedule.employees.map((employee) =>
    toScheduleRow(employee, state.visibleWeekdays)
  );

  return (
    <div className="space-y-3">
      <ScheduleToolbar
        employeeOptions={state.employeeOptions}
        onEmployeesChange={state.setSelectedEmployeeIds}
        onWeekChange={state.setWeekStart}
        onWeekdaysChange={state.setVisibleWeekdays}
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

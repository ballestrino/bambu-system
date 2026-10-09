"use client";

import { useMemo } from "react";

import { buildWeeklySchedule } from "@/lib/ops/schedule-mapper";
import type { ScheduleDay } from "@/lib/ops/schedule-types";
import { getScheduleWeek, parseScheduleWeekParam } from "@/lib/ops/schedule-week";
import { useOpsPersistedState } from "@/components/ops/shared";
import type { VisitsController } from "@/components/ops/visits/hooks/use-visits-controller";

export const UNASSIGNED_PICK = "sin";

export type MobileScheduleColumn = {
  days: ScheduleDay[];
  id: string;
  minutes: number;
  name: string;
  total: number;
  unassigned: boolean;
};

const defaultPickState = { picks: null as string[] | null };

const toColumn = (id: string, name: string, days: ScheduleDay[], unassigned = false): MobileScheduleColumn => ({
  days,
  id,
  minutes: days.reduce((sum, day) => sum + day.visits.reduce((total, visit) => total + visit.endMinute - visit.startMinute, 0), 0),
  name,
  total: days.reduce((sum, day) => sum + day.visits.length, 0),
  unassigned,
});

// Cronograma del celular (2a): la semana del dia elegido, una columna por
// empleada elegida en el selector (todas si nunca se eligio).
export const useMobileSchedule = (ctrl: VisitsController) => {
  const [state, setState] = useOpsPersistedState("bambu:ops:visits:picks", defaultPickState);
  const { dayKey } = ctrl.desk;
  const { employees, scoped } = ctrl.data;

  const columns = useMemo(() => {
    const week = getScheduleWeek(parseScheduleWeekParam(dayKey));
    const schedule = buildWeeklySchedule({ employees, generatedAt: new Date(), occurrences: scoped, week });
    const unassigned = toColumn(UNASSIGNED_PICK, "Sin asignar", schedule.unassigned, true);
    // "Sin asignar" solo aparece si esa semana tiene algo por asignar.
    return [
      ...(unassigned.total ? [unassigned] : []),
      ...schedule.employees.map((employee) => toColumn(employee.id, employee.name, employee.days)),
    ];
  }, [dayKey, employees, scoped]);

  const allIds = columns.map((column) => column.id);
  const picks = Array.isArray(state.picks) ? state.picks.filter((id) => allIds.includes(id)) : allIds;
  const visible = columns.filter((column) => picks.includes(column.id));
  const all = picks.length === allIds.length;

  return {
    all,
    columns,
    picks,
    setAll: () => setState({ picks: all ? allIds.slice(0, 1) : null }),
    toggle: (id: string) => {
      const next = picks.includes(id) ? picks.filter((pick) => pick !== id) : allIds.filter((pick) => pick === id || picks.includes(pick));
      if (next.length) setState({ picks: next.length === allIds.length ? null : next });
    },
    visible,
  };
};

export type MobileSchedule = ReturnType<typeof useMobileSchedule>;

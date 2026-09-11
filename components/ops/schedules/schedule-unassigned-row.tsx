"use client";

import type { WeeklySchedule } from "@/lib/ops/schedule-types";
import {
  ScheduleGrid,
  ScheduleList,
  type ScheduleHandlers,
  type ScheduleRow,
} from "@/components/ops/schedules/schedule-grid";

// Las visitas sin equipo no pueden quedar invisibles: son las que hay que
// resolver antes de mandar el cronograma.
export const ScheduleUnassignedRow = ({
  handlers,
  schedule,
  visibleWeekdays,
}: {
  handlers: ScheduleHandlers;
  schedule: WeeklySchedule;
  visibleWeekdays: number[];
}) => {
  const days = schedule.unassigned.filter((day) =>
    visibleWeekdays.includes(day.weekdayNumber)
  );
  const totalVisits = days.reduce((total, day) => total + day.visits.length, 0);

  if (!totalVisits) {
    return null;
  }

  const rows: ScheduleRow[] = [
    { days, employeeId: null, name: "Sin asignar", overlapCount: 0, totalVisits },
  ];

  return (
    <>
      <ScheduleGrid handlers={handlers} rows={rows} />
      <ScheduleList handlers={handlers} rows={rows} />
    </>
  );
};

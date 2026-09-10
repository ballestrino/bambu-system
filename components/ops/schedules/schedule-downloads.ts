import type { ScheduleEmployee, WeeklySchedule } from "@/lib/ops/schedule-types";
import { downloadPdf, safeFilename } from "@/components/ops/shared/ops-download";

// Import diferido: los bytes del logo solo se cargan cuando alguien exporta.
const loadBuilders = () => import("@/components/ops/schedules/schedule-pdf");

export const downloadEmployeeSchedulePdf = async (
  employee: ScheduleEmployee,
  schedule: WeeklySchedule,
  visibleWeekdays?: number[]
) => {
  const { buildEmployeeSchedulePdf } = await loadBuilders();

  downloadPdf(
    `cronograma-${safeFilename(employee.name)}-${schedule.weekStartKey}.pdf`,
    buildEmployeeSchedulePdf(employee, schedule, visibleWeekdays)
  );
};

export const downloadTeamSchedulePdf = async (
  schedule: WeeklySchedule,
  visibleWeekdays?: number[]
) => {
  const { buildTeamSchedulePdf } = await loadBuilders();

  downloadPdf(
    `cronogramas-equipo-${schedule.weekStartKey}.pdf`,
    buildTeamSchedulePdf(schedule, visibleWeekdays)
  );
};

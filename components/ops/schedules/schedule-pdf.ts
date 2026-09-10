import { bambuLogoImage } from "@/lib/pdf/bambu-logo-asset";
import { buildSimplePdf, pdfLine, pdfRect, pdfText } from "@/lib/pdf/simple-pdf";
import { countDeliverableVisits, getDeliverableDays } from "@/lib/ops/schedule-mapper";
import type { ScheduleEmployee, WeeklySchedule } from "@/lib/ops/schedule-types";
import { buildDayBlocks } from "@/components/ops/schedules/schedule-pdf-rows";
import {
  drawScheduleCover,
  drawScheduleFooter,
} from "@/components/ops/schedules/schedule-pdf-page";
import {
  scheduleColors,
  scheduleLayout,
} from "@/components/ops/schedules/schedule-pdf-theme";

const { bottomLimit, contentWidth, margin, rightEdge } = scheduleLayout;

export const finalizeSchedulePages = (bodies: string[], subtitle: string) =>
  bodies.map(
    (body, index) => body + drawScheduleFooter(index + 1, bodies.length, subtitle)
  );

export const buildEmployeeSchedulePages = (
  employee: ScheduleEmployee,
  schedule: WeeklySchedule,
  visibleWeekdays?: number[]
) =>
  finalizeSchedulePages(
    buildDayBlocks(
      getDeliverableDays(employee, visibleWeekdays),
      employee.name,
      schedule.weekLabel
    ),
    employee.name
  );

export const buildEmployeeSchedulePdf = (
  employee: ScheduleEmployee,
  schedule: WeeklySchedule,
  visibleWeekdays?: number[]
) =>
  buildSimplePdf(buildEmployeeSchedulePages(employee, schedule, visibleWeekdays), [
    bambuLogoImage,
  ]);

// Portada del PDF de equipo: hace navegable un archivo con una seccion por
// empleada.
const buildTeamCoverPage = (schedule: WeeklySchedule, visibleWeekdays?: number[]) => {
  let content = drawScheduleCover({
    subtitle: "Equipo completo",
    title: "Cronogramas del equipo",
    weekLabel: schedule.weekLabel,
  });
  let y = 672;

  content += pdfRect(margin, y - 17, contentWidth, 23, scheduleColors.bambooSoft);
  content += pdfText(margin + 8, y - 10, 8, "EMPLEADA", {
    bold: true,
    color: scheduleColors.muted,
  });
  content += pdfText(rightEdge - 8, y - 10, 8, "VISITAS", {
    align: "right",
    bold: true,
    color: scheduleColors.muted,
  });
  y -= 31;

  schedule.employees.forEach((employee) => {
    if (y < bottomLimit + 16) {
      return;
    }

    content += pdfText(margin + 8, y, 10, employee.name, {
      color: scheduleColors.text,
    });
    content += pdfText(rightEdge - 8, y, 10, String(countDeliverableVisits(employee, visibleWeekdays)), {
      align: "right",
      bold: true,
      color: scheduleColors.bambooStrong,
    });
    y -= 17;
    content += pdfLine(margin, y + 6, rightEdge, y + 6, scheduleColors.border);
  });

  return content + drawScheduleFooter(1, 1, "Equipo completo");
};

export const buildTeamSchedulePdf = (
  schedule: WeeklySchedule,
  visibleWeekdays?: number[]
) =>
  buildSimplePdf(
    [
      buildTeamCoverPage(schedule, visibleWeekdays),
      ...schedule.employees.flatMap((employee) =>
        buildEmployeeSchedulePages(employee, schedule, visibleWeekdays)
      ),
    ],
    [bambuLogoImage]
  );

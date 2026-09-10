import { pdfLine, pdfText, wrapPdfText } from "@/lib/pdf/simple-pdf";
import type { ScheduleDay, ScheduleVisit } from "@/lib/ops/schedule-types";
import {
  drawColumnHeader,
  drawDayHeader,
  drawScheduleContinuation,
  drawScheduleCover,
} from "@/components/ops/schedules/schedule-pdf-page";
import {
  scheduleColors,
  scheduleColumns,
  scheduleLayout,
} from "@/components/ops/schedules/schedule-pdf-theme";

const { bottomLimit, margin, rightEdge } = scheduleLayout;
const COVER_TOP = 672;
const CONTINUATION_TOP = 740;
const LINE_HEIGHT = 11;

type VisitCells = {
  address: string[];
  height: number;
  teammates: string[];
  work: string[];
};

const wrapCell = (value: string, width: number, size: number) =>
  wrapPdfText(value, width, size).slice(0, 2);

const measureVisit = (visit: ScheduleVisit): VisitCells => {
  const address = wrapCell(visit.address, scheduleColumns.address.width, 8);
  const teammates = wrapCell(
    visit.teammates.length ? visit.teammates.join(", ") : "Sin compañeras",
    scheduleColumns.teammates.width,
    8
  );
  const work = wrapCell(visit.jobName, scheduleColumns.work.width, 9);

  return {
    address,
    height:
      12 + Math.max(work.length, address.length, teammates.length) * LINE_HEIGHT,
    teammates,
    work,
  };
};

const drawVisit = (visit: ScheduleVisit, cells: VisitCells, y: number) => {
  const column = (lines: string[], x: number, size: number, bold: boolean) =>
    lines
      .map((line, index) =>
        pdfText(x, y - 10 - index * LINE_HEIGHT, size, line, {
          bold,
          color: bold ? scheduleColors.text : scheduleColors.muted,
        })
      )
      .join("");

  return (
    pdfText(
      scheduleColumns.schedule.x,
      y - 10,
      9,
      `${visit.startLabel} - ${visit.endLabel}`,
      { bold: true, color: scheduleColors.text }
    ) +
    column(cells.work, scheduleColumns.work.x, 9, true) +
    column(cells.address, scheduleColumns.address.x, 8, false) +
    column(cells.teammates, scheduleColumns.teammates.x, 8, false)
  );
};

export const buildDayBlocks = (
  days: ScheduleDay[],
  subtitle: string,
  weekLabel: string
) => {
  const pages: string[] = [];
  let content = drawScheduleCover({
    subtitle,
    title: "Cronograma semanal",
    weekLabel,
  });
  let y = COVER_TOP;

  const breakPage = () => {
    pages.push(content);
    content = drawScheduleContinuation(subtitle, weekLabel);
    y = CONTINUATION_TOP;
  };
  const ensureSpace = (height: number, repeat?: () => void) => {
    if (y - height >= bottomLimit) {
      return;
    }
    breakPage();
    repeat?.();
  };

  days.forEach((day) => {
    const openDay = () => {
      content += drawDayHeader(day.longLabel, y);
      y -= 27;
      if (day.visits.length) {
        content += drawColumnHeader(y);
        y -= 13;
      }
    };

    ensureSpace(day.visits.length ? 74 : 46);
    openDay();

    if (!day.visits.length) {
      content += pdfText(scheduleColumns.schedule.x, y - 8, 9, "Sin visitas asignadas", {
        color: scheduleColors.muted,
      });
      y -= 26;
      return;
    }

    day.visits.forEach((visit) => {
      const cells = measureVisit(visit);
      ensureSpace(cells.height, openDay);
      content += drawVisit(visit, cells, y);
      y -= cells.height;
      content += pdfLine(margin, y + 6, rightEdge, y + 6, scheduleColors.border);
    });
    y -= 14;
  });

  return [...pages, content];
};

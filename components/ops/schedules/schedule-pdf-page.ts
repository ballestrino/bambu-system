import { bambuLogoImage } from "@/lib/pdf/bambu-logo-asset";
import { PDF_PAGE, pdfImage, pdfLine, pdfRect, pdfText } from "@/lib/pdf/simple-pdf";
import {
  scheduleColors,
  scheduleColumns,
  scheduleLayout,
} from "@/components/ops/schedules/schedule-pdf-theme";

const { margin, rightEdge } = scheduleLayout;
const LOGO_HEIGHT = 50;
const LOGO_WIDTH = (LOGO_HEIGHT * bambuLogoImage.width) / bambuLogoImage.height;

export const scheduleTopBar = () =>
  pdfRect(0, PDF_PAGE.height - 10, PDF_PAGE.width, 10, scheduleColors.bambooStrong);

// El logo se aplano sobre blanco al generarlo, por eso va en zona blanca y
// nunca encima de la barra verde.
export const drawScheduleLogo = (y: number, height = LOGO_HEIGHT) =>
  pdfImage(
    margin,
    y,
    (height * bambuLogoImage.width) / bambuLogoImage.height,
    height,
    bambuLogoImage.name
  );

export const drawScheduleCover = (input: {
  subtitle: string;
  title: string;
  weekLabel: string;
}) => {
  const textX = margin + LOGO_WIDTH + 16;
  let content = scheduleTopBar() + drawScheduleLogo(PDF_PAGE.height - 118);

  content += pdfText(textX, PDF_PAGE.height - 78, 9, "BAMBÚ", {
    bold: true,
    color: scheduleColors.bamboo,
  });
  content += pdfText(textX, PDF_PAGE.height - 100, 21, input.title, {
    bold: true,
    color: scheduleColors.bambooStrong,
  });
  content += pdfText(textX, PDF_PAGE.height - 118, 13, input.subtitle, {
    bold: true,
    color: scheduleColors.text,
  });
  content += pdfText(margin, PDF_PAGE.height - 144, 10, input.weekLabel, {
    color: scheduleColors.muted,
  });
  content += pdfLine(margin, PDF_PAGE.height - 154, rightEdge, PDF_PAGE.height - 154);

  return content;
};

export const drawScheduleContinuation = (subtitle: string, weekLabel: string) => {
  let content = scheduleTopBar() + drawScheduleLogo(PDF_PAGE.height - 76, 30);

  content += pdfText(margin + 40, PDF_PAGE.height - 60, 13, subtitle, {
    bold: true,
    color: scheduleColors.bambooStrong,
  });
  content += pdfText(rightEdge, PDF_PAGE.height - 60, 9, weekLabel, {
    align: "right",
    color: scheduleColors.muted,
  });
  content += pdfLine(margin, PDF_PAGE.height - 86, rightEdge, PDF_PAGE.height - 86);

  return content;
};

export const drawDayHeader = (label: string, y: number) =>
  pdfRect(margin, y - 17, scheduleLayout.contentWidth, 23, scheduleColors.bambooSoft) +
  pdfText(margin + 8, y - 10, 10, label.toUpperCase(), {
    bold: true,
    color: scheduleColors.bambooStrong,
  });

export const drawColumnHeader = (y: number) =>
  pdfText(scheduleColumns.schedule.x, y, 8, "HORARIO", {
    bold: true,
    color: scheduleColors.muted,
  }) +
  pdfText(scheduleColumns.work.x, y, 8, "TRABAJO", {
    bold: true,
    color: scheduleColors.muted,
  }) +
  pdfText(scheduleColumns.address.x, y, 8, "DIRECCIÓN", {
    bold: true,
    color: scheduleColors.muted,
  }) +
  pdfText(scheduleColumns.teammates.x, y, 8, "CON", {
    bold: true,
    color: scheduleColors.muted,
  });

export const drawScheduleFooter = (
  pageNumber: number,
  totalPages: number,
  subtitle: string
) =>
  pdfLine(margin, 40, rightEdge, 40) +
  pdfText(margin, 26, 8, `Bambú · Cronograma semanal · ${subtitle}`, {
    color: scheduleColors.muted,
  }) +
  pdfText(rightEdge, 26, 8, `Página ${pageNumber} de ${totalPages}`, {
    align: "right",
    color: scheduleColors.muted,
  });

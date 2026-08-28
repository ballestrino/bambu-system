import type {
  OpsEmployeePayment,
  OpsJobClientPayment,
  OpsOperationalCost,
} from "@/components/ops/types";
import {
  buildFinancialReportRows,
  type FinancialReportRow,
  type FinancialReportSummary,
} from "@/components/ops/financial/financial-report-data";
import {
  buildSimplePdf,
  PDF_PAGE,
  pdfLine,
  pdfRect,
  pdfText,
  wrapPdfText,
} from "@/lib/pdf/simple-pdf";

type FinancialReportInput = {
  clientPayments: OpsJobClientPayment[];
  costs: OpsOperationalCost[];
  employeePayments: OpsEmployeePayment[];
  generatedAt?: Date;
  monthKey: string;
  monthLabel: string;
  summary: FinancialReportSummary;
};

const margin = 44;
const contentWidth = PDF_PAGE.width - margin * 2;
const money = new Intl.NumberFormat("es-UY", {
  currency: "UYU",
  maximumFractionDigits: 2,
  style: "currency",
});
const date = new Intl.DateTimeFormat("es-UY", { dateStyle: "short" });
const dateTime = new Intl.DateTimeFormat("es-UY", {
  dateStyle: "short",
  timeStyle: "short",
});

const formatMoney = (value: number) => money.format(value);
const recordedTotal = (rows: FinancialReportRow[]) =>
  rows.reduce((total, row) => row.status === "RECORDED" ? total + row.amount : total, 0);

const addPageFurniture = (pageNumber: number, period: string) =>
  pdfRect(0, PDF_PAGE.height - 10, PDF_PAGE.width, 10, "0.18 0.38 0.22") +
  pdfLine(margin, 36, PDF_PAGE.width - margin, 36) +
  pdfText(margin, 22, 8, `Bambú System · Finanzas · ${period}`, { color: "0.38 0.45 0.39" }) +
  pdfText(PDF_PAGE.width - margin, 22, 8, `Página ${pageNumber}`, {
    align: "right",
    color: "0.38 0.45 0.39",
  });

export const buildFinancialReportPdf = (input: FinancialReportInput) => {
  const generatedAt = input.generatedAt ?? new Date();
  const rows = buildFinancialReportRows(input);
  const pages: string[] = [];
  let content = "";
  let y = PDF_PAGE.height - 54;

  const startPage = () => {
    if (content) pages.push(content);
    content = addPageFurniture(pages.length + 1, input.monthLabel);
    y = PDF_PAGE.height - 54;
  };
  const ensureSpace = (height: number, repeatHeader?: () => void) => {
    if (y - height >= 50) return;
    startPage();
    repeatHeader?.();
  };
  const sectionHeader = (title: string, count: number, total: number) => {
    content += pdfText(margin, y, 13, title, { bold: true, color: "0.14 0.30 0.18" });
    content += pdfText(PDF_PAGE.width - margin, y, 9, `${count} movimiento${count === 1 ? "" : "s"} · ${formatMoney(total)}`, {
      align: "right",
      color: "0.32 0.39 0.34",
    });
    y -= 18;
    content += pdfRect(margin, y - 18, contentWidth, 24, "0.93 0.96 0.93");
    content += pdfText(margin + 8, y - 10, 8, "FECHA", { bold: true, color: "0.32 0.39 0.34" });
    content += pdfText(margin + 82, y - 10, 8, "DETALLE", { bold: true, color: "0.32 0.39 0.34" });
    content += pdfText(PDF_PAGE.width - margin - 102, y - 10, 8, "ESTADO", { bold: true, color: "0.32 0.39 0.34" });
    content += pdfText(PDF_PAGE.width - margin - 8, y - 10, 8, "IMPORTE", {
      align: "right",
      bold: true,
      color: "0.32 0.39 0.34",
    });
    y -= 28;
  };
  const drawSection = (title: string, sectionRows: FinancialReportRow[]) => {
    ensureSpace(70);
    sectionHeader(title, sectionRows.length, recordedTotal(sectionRows));
    if (!sectionRows.length) {
      content += pdfText(margin + 8, y - 4, 9, "No hay movimientos para este período.", {
        color: "0.38 0.45 0.39",
      });
      y -= 32;
      return;
    }

    sectionRows
      .toSorted((left, right) => right.date.getTime() - left.date.getTime())
      .forEach((row) => {
        const detailLines = wrapPdfText(row.detail, 220, 9).slice(0, 2);
        const secondaryLines = wrapPdfText(row.secondary, 220, 8).slice(0, 2);
        const rowHeight = 18 + detailLines.length * 10 + secondaryLines.length * 10;
        ensureSpace(rowHeight, () => sectionHeader(title, sectionRows.length, recordedTotal(sectionRows)));
        if (row.status === "VOIDED") {
          content += pdfRect(margin, y - rowHeight + 7, contentWidth, rowHeight, "0.98 0.96 0.94");
        }
        content += pdfText(margin + 8, y - 9, 9, date.format(row.date));
        detailLines.forEach((line, index) => {
          content += pdfText(margin + 82, y - 9 - index * 10, 9, line, { bold: true });
        });
        secondaryLines.forEach((line, index) => {
          content += pdfText(margin + 82, y - 11 - detailLines.length * 10 - index * 10, 8, line, { color: "0.38 0.45 0.39" });
        });
        content += pdfText(PDF_PAGE.width - margin - 102, y - 9, 8, row.status === "RECORDED" ? "Registrado" : "Anulado", {
          bold: true,
          color: row.status === "RECORDED" ? "0.18 0.38 0.22" : "0.56 0.28 0.16",
        });
        content += pdfText(PDF_PAGE.width - margin - 8, y - 9, 9, formatMoney(row.amount), {
          align: "right",
          bold: true,
          color: row.status === "RECORDED" ? "0.09 0.15 0.11" : "0.56 0.28 0.16",
        });
        y -= rowHeight;
        content += pdfLine(margin, y + 7, PDF_PAGE.width - margin, y + 7, "0.89 0.91 0.89");
      });
    y -= 22;
  };

  startPage();
  content += pdfText(margin, y, 9, "BAMBÚ SYSTEM", { bold: true, color: "0.18 0.38 0.22" });
  y -= 24;
  content += pdfText(margin, y, 22, "Reporte de finanzas", { bold: true, color: "0.14 0.30 0.18" });
  y -= 18;
  content += pdfText(margin, y, 10, `Período: ${input.monthLabel} · Generado: ${dateTime.format(generatedAt)}`, {
    color: "0.32 0.39 0.34",
  });
  y -= 32;

  const cards = [
    ["INGRESOS", input.summary.recordedRevenue],
    ["EGRESOS", input.summary.totalCosts],
    ["RESULTADO", input.summary.realProfit],
    ["MARGEN", `${input.summary.marginPercent.toFixed(1)} %`],
  ] as const;
  cards.forEach(([label, value], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + column * 258;
    const cardY = y - row * 62;
    content += pdfRect(x, cardY - 42, 249, 50, "0.95 0.97 0.95");
    content += pdfText(x + 12, cardY - 8, 8, label, { bold: true, color: "0.38 0.45 0.39" });
    content += pdfText(x + 12, cardY - 28, 14, typeof value === "number" ? formatMoney(value) : value, {
      bold: true,
      color: label === "RESULTADO" && input.summary.realProfit < 0 ? "0.65 0.20 0.18" : "0.14 0.30 0.18",
    });
  });
  y -= 132;
  content += pdfRect(margin, y - 28, contentWidth, 36, "0.97 0.98 0.96");
  content += pdfText(margin + 10, y - 7, 8, "Los movimientos anulados se muestran como historial y no integran los totales.", {
    color: "0.32 0.39 0.34",
  });
  content += pdfText(margin + 10, y - 19, 8, "Los egresos suman costes operativos y pagos registrados a empleadas.", {
    color: "0.32 0.39 0.34",
  });
  y -= 52;

  drawSection("Ingresos - Cobros de trabajos", rows.income);
  drawSection("Egresos - Costes operativos", rows.costs);
  drawSection("Egresos - Pagos a empleadas", rows.employeePayments);
  pages.push(content);

  return buildSimplePdf(pages);
};

export const downloadFinancialReportPdf = (input: FinancialReportInput) => {
  const bytes = buildFinancialReportPdf(input);
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `finanzas-${input.monthKey}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

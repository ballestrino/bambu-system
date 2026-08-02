import type { CellValue, Workbook, Worksheet } from "exceljs";

import {
  buildJobExportRows,
  type JobExportRow,
  type JobExportSource,
} from "@/lib/ops/job-export";

const columns = [
  ["Trabajo", 28], ["Tipo", 14], ["Descripción", 34],
  ["Dirección", 28], ["Notas operativas", 36], ["Presupuesto", 26],
  ["Precio trabajo", 17], ["Precio/hora", 16], ["Horas totales", 15],
  ["Visitas", 11], ["Frecuencia", 14], ["Horas/visita", 15],
  ["Personas", 11], ["Incluye productos", 18],
  ["Precio productos incluidos", 24], ["Inicio puntual", 16],
  ["Fin puntual", 16], ["Creado", 20], ["Actualizado", 20],
] as const;

const optionalText = (value: string) => value || null;

const toTableRow = (row: JobExportRow, excelRow: number): CellValue[] => [
  row.name, row.jobType, optionalText(row.description),
  optionalText(row.serviceAddress), optionalText(row.operationalNotes),
  optionalText(row.budgetName), row.price,
  { formula: `IFERROR(G${excelRow}/I${excelRow},"")`, result: row.hourlyPrice ?? "" },
  row.totalHours, row.visits, optionalText(row.visitFrequency), row.hoursPerVisit,
  row.employees,
  row.hasProducts === null ? null : row.hasProducts ? "Sí" : "No",
  row.productsCost, row.punctualStartDate, row.punctualEndDate, row.createdAt,
  row.updatedAt,
];

const styleSheet = (sheet: Worksheet, rowCount: number) => {
  sheet.views = [{ state: "frozen", ySplit: 5, showGridLines: false }];
  sheet.pageSetup = {
    fitToPage: true,
    fitToWidth: 1,
    orientation: "landscape",
    paperSize: 9,
  };
  columns.forEach(([, width], index) => {
    sheet.getColumn(index + 1).width = width;
  });

  sheet.getRow(1).height = 30;
  sheet.getCell("A1").font = { bold: true, color: { argb: "FFFFFFFF" }, size: 18 };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF244C2D" } };
  sheet.getCell("A1").alignment = { vertical: "middle" };
  sheet.getCell("A2").font = { color: { argb: "FF53645A" }, italic: true };
  sheet.getCell("A3").font = { bold: true, color: { argb: "FF244C2D" } };

  const lastRow = Math.max(rowCount + 5, 5);
  ["G", "H", "O"].forEach((column) => {
    sheet.getColumn(column).numFmt = '"$"#,##0.00';
  });
  ["I", "J", "L"].forEach((column) => {
    sheet.getColumn(column).numFmt = "0.00";
  });
  sheet.getColumn("M").numFmt = "0";
  ["P", "Q"].forEach((column) => {
    sheet.getColumn(column).numFmt = "yyyy-mm-dd";
  });
  ["R", "S"].forEach((column) => {
    sheet.getColumn(column).numFmt = "yyyy-mm-dd hh:mm";
  });
  for (let rowNumber = 6; rowNumber <= lastRow; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    row.alignment = { vertical: "top" };
    [3, 4, 5].forEach((column) => {
      row.getCell(column).alignment = { vertical: "top", wrapText: true };
    });
  }
};

export const buildJobsWorkbook = async (jobs: JobExportSource[]): Promise<Workbook> => {
  const excelModule = (await import("exceljs")) as typeof import("exceljs") & {
    default?: typeof import("exceljs");
  };
  const ExcelWorkbook = excelModule.default?.Workbook ?? excelModule.Workbook;
  const rows = buildJobExportRows(jobs);
  const workbook = new ExcelWorkbook();
  const sheet = workbook.addWorksheet("Trabajos");
  const now = new Date();

  workbook.creator = "Bambu System";
  workbook.created = now;
  workbook.modified = now;
  workbook.calcProperties.fullCalcOnLoad = true;
  sheet.mergeCells("A1:S1");
  sheet.getCell("A1").value = "Exportación de trabajos";
  sheet.getCell("A2").value = `Generado: ${now.toLocaleString("es-UY")} · según filtros activos`;
  sheet.getCell("A3").value = `${rows.length} trabajo(s)`;
  sheet.addTable({
    name: "TrabajosExportados",
    ref: "A5",
    headerRow: true,
    style: { showRowStripes: true, theme: "TableStyleMedium4" },
    columns: columns.map(([name]) => ({ name, filterButton: true })),
    rows: rows.map((row, index) => toTableRow(row, index + 6)),
  });
  styleSheet(sheet, rows.length);

  return workbook;
};

export const downloadJobsWorkbook = async (jobs: JobExportSource[]) => {
  const workbook = await buildJobsWorkbook(jobs);
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([new Uint8Array(buffer)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `trabajos-${new Date().toISOString().slice(0, 10)}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
};

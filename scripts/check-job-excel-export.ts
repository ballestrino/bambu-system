import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { buildJobsWorkbook } from "@/components/ops/jobs/job-excel-export";
import {
  buildJobExportRows,
  type JobExportSource,
} from "@/lib/ops/job-export";

const jobs: JobExportSource[] = [
  {
    budgetIncludesIva: false,
    budgetSnapshot: {
      budget: { name: "Casa Centro", slug: "casa-centro" },
      option: {
        employees: 2,
        hasProducts: true,
        hoursPerVisit: 3,
        id: "option-1",
        iva: 22,
        nominalHour: 210,
        price: 1220,
        productsPrice: 150,
        revenuePercent: 20,
        visitType: "week",
        visits: 2,
      },
    },
    createdAt: "2026-08-01T12:00:00.000Z",
    description: "Limpieza recurrente",
    jobType: "ONGOING",
    name: "Casa Centro",
    operationalNotes: "Llave en recepción",
    serviceAddress: "Av. Principal 123",
    sourceBudget: { name: "Casa Centro" },
    updatedAt: "2026-08-02T12:00:00.000Z",
  },
  {
    budgetIncludesIva: true,
    createdAt: "2026-07-01T12:00:00.000Z",
    jobType: "PUNCTUAL",
    name: "Trabajo sin presupuesto",
    punctualEndDate: "2026-07-02T12:00:00.000Z",
    punctualStartDate: "2026-07-01T12:00:00.000Z",
    updatedAt: "2026-07-31T12:00:00.000Z",
  },
];

const checkExport = async () => {
  const [pricedRow, emptyRow] = buildJobExportRows(jobs);
  assert.equal(pricedRow.price, 1000);
  assert.equal(pricedRow.totalHours, 51.84);
  assert.equal(pricedRow.hourlyPrice, 19.29);
  assert.equal(pricedRow.visitFrequency, "Semanal");
  assert.equal(emptyRow.price, null);

  const workbook = await buildJobsWorkbook(jobs);
  const sheet = workbook.getWorksheet("Trabajos");
  assert.ok(sheet);
  assert.equal(sheet.getCell("A1").value, "Exportación de trabajos");
  assert.match(String(sheet.getCell("A2").value), /según filtros activos/);
  assert.equal(sheet.getCell("A6").value, "Casa Centro");
  assert.equal(sheet.getCell("G6").value, 1000);
  assert.deepEqual(sheet.getCell("H6").value, {
    formula: 'IFERROR(G6/I6,"")',
    result: 19.29,
  });
  assert.ok(sheet.getCell("R6").value instanceof Date);
  assert.equal(sheet.getTable("TrabajosExportados").ref, "A5");
  assert.ok(sheet.getCell("S7").value instanceof Date);
  assert.deepEqual(
    Array.from(
      { length: 19 },
      (_, index) => sheet.getRow(5).getCell(index + 1).value,
    ),
    [
      "Trabajo",
      "Tipo",
      "Descripción",
      "Dirección",
      "Notas operativas",
      "Presupuesto",
      "Precio trabajo",
      "Precio/hora",
      "Horas totales",
      "Visitas",
      "Frecuencia",
      "Horas/visita",
      "Personas",
      "Incluye productos",
      "Precio productos incluidos",
      "Inicio puntual",
      "Fin puntual",
      "Creado",
      "Actualizado",
    ],
  );

  const configuredOutput = process.env.JOB_EXPORT_CHECK_OUTPUT;
  const outputPath = configuredOutput ?? join(tmpdir(), "bambu-job-export-check.xlsx");
  await workbook.xlsx.writeFile(outputPath);

  const excelModule = (await import("exceljs")) as typeof import("exceljs") & {
    default?: typeof import("exceljs");
  };
  const ExcelWorkbook = excelModule.default?.Workbook ?? excelModule.Workbook;
  const reopened = new ExcelWorkbook();
  await reopened.xlsx.readFile(outputPath);
  assert.equal(reopened.getWorksheet("Trabajos")?.getCell("G6").value, 1000);
  assert.equal(reopened.getWorksheet("Trabajos")?.getCell("C7").value, null);
  assert.equal(reopened.getWorksheet("Trabajos")?.getCell("K7").value, null);
  const reopenedFormula = reopened.getWorksheet("Trabajos")?.getCell("H6").value;
  assert.ok(
    reopenedFormula &&
      typeof reopenedFormula === "object" &&
      "formula" in reopenedFormula
  );
  assert.equal(reopenedFormula.formula, 'IFERROR(G6/I6,"")');

  console.log(`Job Excel export check passed: ${outputPath}`);
  if (!configuredOutput) await rm(outputPath, { force: true });
};

void checkExport();

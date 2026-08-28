import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";

import { buildFinancialReportRows } from "../components/ops/financial/financial-report-data";
import { buildFinancialReportPdf } from "../components/ops/financial/financial-report-pdf";
import type {
  OpsEmployeePayment,
  OpsJobClientPayment,
  OpsOperationalCost,
} from "../components/ops/types";

const clientPayments = [
  {
    amount: 12500,
    id: "income-recorded",
    job: { name: "Oficina Centro" },
    paymentDate: new Date("2026-08-10T12:00:00.000Z"),
    reference: "Transferencia 1042",
    notes: "Cobro mensual",
    status: "RECORDED",
  },
  {
    amount: 4000,
    id: "income-voided",
    job: { name: "Local Cordón" },
    paymentDate: new Date("2026-08-08T12:00:00.000Z"),
    reference: null,
    notes: "Duplicado",
    status: "VOIDED",
  },
] as unknown as OpsJobClientPayment[];
const costs = [{
  amount: 1800,
  category: { name: "Insumos" },
  costDate: new Date("2026-08-09T12:00:00.000Z"),
  employee: null,
  id: "cost-recorded",
  job: { name: "Oficina Centro" },
  notes: "Productos de limpieza",
  reference: "Factura 82",
  status: "RECORDED",
}] as unknown as OpsOperationalCost[];
const employeePayments = [{
  amount: 5200,
  employee: { name: "María Núñez" },
  id: "payroll-recorded",
  notes: "Pago quincenal",
  paymentDate: new Date("2026-08-15T12:00:00.000Z"),
  periodEnd: new Date("2026-08-15T23:59:59.000Z"),
  periodStart: new Date("2026-08-01T00:00:00.000Z"),
  reference: "Recibo 15",
  status: "RECORDED",
}] as unknown as OpsEmployeePayment[];

const rows = buildFinancialReportRows({ clientPayments, costs, employeePayments });
assert.equal(rows.income.length, 2);
assert.equal(rows.income[1].status, "VOIDED");
assert.equal(rows.costs[0].detail, "Insumos - Oficina Centro");
assert.equal(rows.employeePayments[0].detail, "María Núñez");

const pdf = buildFinancialReportPdf({
  clientPayments,
  costs,
  employeePayments,
  generatedAt: new Date("2026-08-28T14:30:00.000Z"),
  monthKey: "2026-08",
  monthLabel: "agosto de 2026",
  summary: {
    marginPercent: 44,
    realProfit: 5500,
    recordedRevenue: 12500,
    totalCosts: 7000,
  },
});
const source = new TextDecoder().decode(pdf);
assert.ok(source.startsWith("%PDF-1.4"));
assert.match(source, /Reporte de finanzas/);
assert.match(source, /Anulado/);
assert.match(source, /P\\341gina 1/);
assert.ok(pdf.length > 5000);

const denseClientPayments = Array.from({ length: 36 }, (_, index) => ({
  ...clientPayments[0],
  amount: 1000 + index * 25,
  id: `dense-income-${index}`,
  job: {
    name: index === 0
      ? "Servicio mensual de limpieza integral para oficinas administrativas del Centro"
      : `Trabajo de prueba ${index + 1}`,
  },
  notes: `Movimiento de prueba ${index + 1} para validar cortes de página y repetición de encabezados`,
  paymentDate: new Date(Date.UTC(2026, 7, (index % 28) + 1, 12)),
})) as unknown as OpsJobClientPayment[];
const densePdf = buildFinancialReportPdf({
  clientPayments: denseClientPayments,
  costs,
  employeePayments,
  generatedAt: new Date("2026-08-28T14:30:00.000Z"),
  monthKey: "2026-08",
  monthLabel: "agosto de 2026",
  summary: {
    marginPercent: 82.5,
    realProfit: 33000,
    recordedRevenue: 40000,
    totalCosts: 7000,
  },
});
const denseSource = new TextDecoder().decode(densePdf);
assert.ok((denseSource.match(/\/Type \/Page\b/g) ?? []).length >= 3);
assert.doesNotMatch(denseSource, /NaN|undefined/);

const main = async () => {
  if (process.argv.includes("--write-sample")) {
    await mkdir("tmp/pdfs", { recursive: true });
    await writeFile("tmp/pdfs/finanzas-agosto-2026.pdf", pdf);
    await writeFile("tmp/pdfs/finanzas-paginacion.pdf", densePdf);
    console.log("Sample written to tmp/pdfs/finanzas-agosto-2026.pdf");
  }

  console.log("Finance PDF checks passed");
};

void main();

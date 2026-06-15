import { buildEmployeeSummaryPdf } from "@/components/ops/employees/employee-summary-pdf";
import {
  buildEmployeeSummaryCsv,
  type EmployeeMonthlySummary,
} from "@/components/ops/employees/employee-summary-utils";

const safeFilename = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "empleada";

const downloadBlob = (filename: string, blob: Blob) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const downloadEmployeeSummaryCsv = (
  employeeName: string,
  startDate: string,
  endDate: string,
  summary: EmployeeMonthlySummary
) => {
  const csv = buildEmployeeSummaryCsv(employeeName, startDate, endDate, summary);

  downloadBlob(
    `resumen-${safeFilename(employeeName)}-${startDate}-${endDate}.csv`,
    new Blob([csv], { type: "text/csv;charset=utf-8" })
  );
};

export const downloadEmployeeSummaryPdf = (
  employeeName: string,
  startDate: string,
  endDate: string,
  summary: EmployeeMonthlySummary
) => {
  const pdf = buildEmployeeSummaryPdf(employeeName, startDate, endDate, summary);

  downloadBlob(
    `resumen-${safeFilename(employeeName)}-${startDate}-${endDate}.pdf`,
    new Blob([pdf], { type: "application/pdf" })
  );
};

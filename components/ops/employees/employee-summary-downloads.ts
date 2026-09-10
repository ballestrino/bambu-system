import { buildEmployeeSummaryPdf } from "@/components/ops/employees/employee-summary-pdf";
import {
  buildEmployeeSummaryCsv,
  type EmployeeMonthlySummary,
} from "@/components/ops/employees/employee-summary-utils";
import { downloadBlob, safeFilename } from "@/components/ops/shared/ops-download";

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

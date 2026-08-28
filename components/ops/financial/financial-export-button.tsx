"use client";

import { useState } from "react";
import { FileDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { downloadFinancialReportPdf } from "@/components/ops/financial/financial-report-pdf";
import type { FinancialReportSummary } from "@/components/ops/financial/financial-report-data";
import type { FinancialWorkspace } from "@/components/ops/financial/use-financial-workspace";
import { formatMonth } from "@/components/ops/utils";
import { Button } from "@/components/ui/button";

export const FinancialExportButton = ({
  summary,
  workspace,
}: {
  summary: FinancialReportSummary;
  workspace: FinancialWorkspace;
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const isUnavailable = workspace.loading.summary || Boolean(workspace.errors.summary);

  const exportPdf = () => {
    setIsExporting(true);
    try {
      downloadFinancialReportPdf({
        clientPayments: workspace.clientPayments,
        costs: workspace.costs,
        employeePayments: workspace.employeePayments,
        monthKey: workspace.monthKey,
        monthLabel: formatMonth(workspace.month),
        summary,
      });
      toast.success(`Finanzas de ${formatMonth(workspace.month)} exportadas a PDF`);
    } catch {
      toast.error("No pudimos generar el PDF de finanzas");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      disabled={isExporting || isUnavailable}
      onClick={exportPdf}
      size="sm"
      title={isUnavailable ? "Espera a que los datos de finanzas estén disponibles" : undefined}
      type="button"
      variant="outline"
    >
      {isExporting ? <LoaderCircle className="animate-spin" /> : <FileDown />}
      {isExporting ? "Generando..." : "Exportar PDF"}
    </Button>
  );
};

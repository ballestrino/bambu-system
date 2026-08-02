"use client";

import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { getJobsAction } from "@/components/ops/actions/jobs/get-jobs.action";
import { downloadJobsWorkbook } from "@/components/ops/jobs/job-excel-export";
import { Button } from "@/components/ui/button";
import type { JobFilters } from "@/schemas/ops";

export const ExportJobsButton = ({ filters }: { filters: JobFilters }) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportJobs = async () => {
    setIsExporting(true);

    try {
      const jobs =
        (await getJobsAction(filters)) ?? [];
      await downloadJobsWorkbook(jobs);
      toast.success(`${jobs.length} trabajo(s) exportado(s) a Excel`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No pudimos exportar los trabajos"
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      disabled={isExporting}
      size="sm"
      type="button"
      variant="outline"
      onClick={exportJobs}
    >
      {isExporting ? (
        <LoaderCircle className="animate-spin" />
      ) : (
        <Download />
      )}
      {isExporting ? "Exportando..." : "Exportar Excel"}
    </Button>
  );
};

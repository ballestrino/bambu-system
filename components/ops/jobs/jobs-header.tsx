"use client";

import { ExportJobsButton } from "@/components/ops/jobs/export-jobs-button";
import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";
import { jobsOutlineButtonClass, jobsPrimaryButtonClass } from "@/components/ops/jobs/jobs-styles";
import type { JobFilters } from "@/schemas/ops";

// Encabezado de Trabajos (1a): título con el resumen, Exportar Excel y Nuevo
// trabajo. El mes de la rentabilidad sigue en el selector global de arriba.
export const JobsHeader = ({
  count,
  filters,
  jobIds,
}: {
  count: number;
  filters: JobFilters;
  jobIds?: string[];
}) => (
  <div className="flex flex-none flex-wrap items-end justify-between gap-4">
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-ops-bamboo-strong">Operaciones</span>
      <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">Trabajos</h1>
      <span className="text-[13.5px] text-ops-text-muted">
        {count} trabajo(s) en pantalla · operaciones activas, borradores y archivo histórico.
      </span>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <ExportJobsButton className={jobsOutlineButtonClass} filters={filters} jobIds={jobIds} />
      <JobFormDialog triggerClassName={jobsPrimaryButtonClass} />
    </div>
  </div>
);

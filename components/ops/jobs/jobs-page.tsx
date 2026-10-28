"use client";

import { useState } from "react";
import { toast } from "sonner";

import { useJobBulkMutations } from "@/components/ops/hooks/useJobBulkMutations";
import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";
import { downloadJobsWorkbook } from "@/components/ops/jobs/job-excel-export";
import { JobsArchiveDialog, JobsBulkBar } from "@/components/ops/jobs/jobs-bulk-bar";
import { JobsHeader } from "@/components/ops/jobs/jobs-header";
import { JobsTable } from "@/components/ops/jobs/jobs-table";
import { JobsTableBar } from "@/components/ops/jobs/jobs-table-bar";
import { pluralJobs, type JobRow } from "@/components/ops/jobs/jobs-table-model";
import type { JobRowHandlers } from "@/components/ops/jobs/jobs-table-row";
import { useJobsTable } from "@/components/ops/jobs/use-jobs-table";
import { OpsPageShell } from "@/components/ops/shared";
import type { OpsJobListItem } from "@/components/ops/types";
import type { SetJobsStatusInput } from "@/schemas/ops";

// Trabajos como tabla (diseño "Trabajos Bambu 1a"): pestañas de estado,
// filtros en la barra de la tabla, rentabilidad del mes como columna y
// acciones en lote sobre las filas marcadas.
export const JobsPage = () => {
  const table = useJobsTable();
  const { isSettingStatus, setJobsStatusAsync } = useJobBulkMutations();
  const [archiveRows, setArchiveRows] = useState<JobRow[] | null>(null);
  const [editing, setEditing] = useState<{ job: OpsJobListItem; nonce: number; open: boolean } | null>(null);
  const { filters, selection, visibleRows } = table;

  const setStatus = async (jobIds: string[], status: SetJobsStatusInput["status"]) => {
    try {
      await setJobsStatusAsync({ jobIds, status });
      selection.clear();
    } catch {
      // El toast de error ya lo muestra la mutación.
    }
  };

  const exportRows = async (rows: JobRow[]) => {
    try {
      await downloadJobsWorkbook(rows.map((row) => row.job));
      toast.success(`Excel con ${pluralJobs(rows.length)} descargado`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No pudimos exportar los trabajos");
    }
  };

  const handlers: JobRowHandlers = {
    onArchive: (jobIds) => setArchiveRows(visibleRows.filter((row) => jobIds.includes(row.job.id))),
    onEdit: (job) => setEditing({ job, nonce: Date.now(), open: true }),
    onSetStatus: (jobIds, status) => void setStatus(jobIds, status),
  };
  const selectedIds = selection.rows.map((row) => row.job.id);
  const clientFiltered = filters.status !== "all" || filters.attentionOnly;

  return (
    <OpsPageShell className="gap-4">
      <JobsHeader
        count={visibleRows.length}
        filters={{
          includeArchived: filters.includeArchived,
          query: filters.query.trim() || undefined,
          visibility: filters.visibility,
        }}
        jobIds={clientFiltered ? visibleRows.map((row) => row.job.id) : undefined}
      />
      <section className="@container/jobs relative flex flex-col overflow-clip rounded-[14px] border border-ops-border bg-ops-surface">
        <JobsTableBar table={table} />
        <JobsTable handlers={handlers} table={table} />
        <JobsBulkBar
          count={selection.rows.length}
          isPending={isSettingStatus}
          onActivate={() => void setStatus(selectedIds, "ACTIVE")}
          onArchive={() => setArchiveRows(selection.rows)}
          onClear={selection.clear}
          onExport={() => void exportRows(selection.rows)}
          onPause={() => void setStatus(selectedIds, "PAUSED")}
        />
      </section>
      <JobsArchiveDialog
        onCancel={() => setArchiveRows(null)}
        onConfirm={() => {
          const jobIds = archiveRows?.map((row) => row.job.id) ?? [];
          setArchiveRows(null);
          if (jobIds.length) void setStatus(jobIds, "ARCHIVED");
        }}
        rows={archiveRows}
      />
      {editing ? (
        <JobFormDialog
          job={editing.job}
          key={`${editing.job.id}-${editing.nonce}`}
          onOpenChange={(open) => setEditing((current) => (current ? { ...current, open } : current))}
          open={editing.open}
        />
      ) : null}
    </OpsPageShell>
  );
};

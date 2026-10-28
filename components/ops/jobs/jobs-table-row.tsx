"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowUpRight, CalendarDays, MapPin, Pause, Pencil, Play } from "lucide-react";

import { JobsCheckbox } from "@/components/ops/jobs/jobs-checkbox";
import { formatJobRowPrice, type JobRow } from "@/components/ops/jobs/jobs-table-model";
import { jobsGridClass, jobsPillClass } from "@/components/ops/jobs/jobs-styles";
import { JobStatusPill } from "@/components/ops/jobs/status-badges";
import { profitabilityStatus } from "@/components/ops/profitability/profitability-status";
import { OpsActionMenu, type OpsActionMenuItem } from "@/components/ops/shared";
import type { OpsJobListItem } from "@/components/ops/types";
import { cn } from "@/lib/utils";
import type { SetJobsStatusInput } from "@/schemas/ops";

export type JobRowHandlers = {
  onArchive: (jobIds: string[]) => void;
  onEdit: (job: OpsJobListItem) => void;
  onSetStatus: (jobIds: string[], status: SetJobsStatusInput["status"]) => void;
};

const ProfitabilityPill = ({ row }: { row: JobRow }) => {
  if (!row.profitability) return <span className="text-xs text-ops-text-muted">—</span>;
  const status = profitabilityStatus[row.profitability.severity];
  const Icon = status.icon;
  return (
    <span className={cn(jobsPillClass, status.className)}>
      <Icon aria-hidden className="size-[13px]" />
      {status.label}
    </span>
  );
};

export const JobsTableRow = ({
  handlers,
  isSelected,
  onToggle,
  row,
}: {
  handlers: JobRowHandlers;
  isSelected: boolean;
  onToggle: () => void;
  row: JobRow;
}) => {
  const router = useRouter();
  const { job } = row;
  const isRunning = job.status === "ACTIVE";
  const menuItems: OpsActionMenuItem[] = [
    { icon: Pencil, label: "Editar", onSelect: () => handlers.onEdit(job) },
    { icon: CalendarDays, label: "Ver visitas", onSelect: () => router.push(`/dashboard/jobs/${job.id}/occurrences`) },
    isRunning
      ? { icon: Pause, label: "Pausar", onSelect: () => handlers.onSetStatus([job.id], "PAUSED"), separated: true }
      : { icon: Play, label: "Reactivar", onSelect: () => handlers.onSetStatus([job.id], "ACTIVE"), separated: true },
    ...(job.status === "ARCHIVED"
      ? []
      : [{ icon: Archive, label: "Archivar", onSelect: () => handlers.onArchive([job.id]), variant: "destructive" as const }]),
  ];
  const price = formatJobRowPrice(row.price);
  const ivaLabel = job.budgetIncludesIva ? "IVA incluido" : "Sin IVA";

  return (
    <div
      aria-selected={isSelected}
      className={cn(
        jobsGridClass,
        "min-h-[60px] cursor-pointer items-center border-b border-ops-border/60 pr-2 transition-colors",
        isSelected ? "bg-ops-bamboo-soft/70" : "hover:bg-ops-surface-muted/60",
        job.status === "ARCHIVED" && "opacity-65"
      )}
      onClick={onToggle}
      role="row"
    >
      <span className="flex justify-center" role="cell">
        <JobsCheckbox checked={isSelected} label={`Seleccionar ${job.name}`} onCheckedChange={onToggle} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5 py-2.5 pr-3" role="cell">
        <span className="truncate text-sm font-semibold text-ops-text">{job.name}</span>
        <span className={cn("flex min-w-0 items-center gap-1 text-xs", row.location ? "text-ops-text-muted" : "text-ops-text-muted/70")}>
          <MapPin aria-hidden className="size-3 flex-none" />
          <span className="truncate">{row.location ?? "Sin ubicación cargada"}</span>
        </span>
        <span className="truncate text-xs text-ops-text-muted @5xl/jobs:hidden">
          {row.typeLabel} · {row.typeDetail}
        </span>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 @3xl/jobs:hidden">
          <JobStatusPill status={job.status} />
          <ProfitabilityPill row={row} />
          <span className="text-xs font-semibold text-ops-text tabular-nums">{price}</span>
        </div>
      </div>
      <div className="hidden min-w-0 flex-col gap-0.5 @5xl/jobs:flex" role="cell">
        <span className="text-[13px] font-medium text-ops-text">{row.typeLabel}</span>
        <span className="truncate text-xs text-ops-text-muted">{row.typeDetail}</span>
      </div>
      <span
        className={cn("hidden truncate pr-3 text-[13px] @5xl/jobs:block", job.sourceBudget ? "text-ops-text" : "text-ops-text-muted/70")}
        role="cell"
      >
        {job.sourceBudget?.name ?? "Sin vínculo"}
      </span>
      <div className="hidden flex-col items-end gap-px pr-[18px] @3xl/jobs:flex" role="cell">
        <span className="text-[13px] font-semibold whitespace-nowrap text-ops-text tabular-nums">{price}</span>
        <span className="text-[11.5px] whitespace-nowrap text-ops-text-muted">{ivaLabel}</span>
      </div>
      <span className="hidden @3xl/jobs:block" role="cell"><ProfitabilityPill row={row} /></span>
      <span className="hidden @3xl/jobs:block" role="cell"><JobStatusPill status={job.status} /></span>
      <div className="flex items-center justify-end gap-0.5" onClick={(event) => event.stopPropagation()} role="cell">
        <Link
          aria-label={`Detalle de ${job.name}`}
          className="flex size-[30px] items-center justify-center rounded-lg text-ops-text-muted hover:bg-ops-surface-muted hover:text-ops-text"
          href={`/dashboard/jobs/${job.id}`}
          title="Detalle"
        >
          <ArrowUpRight className="size-[15px]" />
        </Link>
        <OpsActionMenu items={menuItems} label={`Más acciones de ${job.name}`} />
      </div>
    </div>
  );
};

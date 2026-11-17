"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, RotateCcw } from "lucide-react";

import { detailPanelClass } from "@/components/budgets/budget-details/budget-detail-service";
import { formatDetailDate } from "@/components/budgets/budget-details/budget-detail-model";
import { formatBudgetMoney } from "@/components/budgets/create-budget/budget-summary-model";
import { budgetKeys } from "@/components/budgets/query-keys";
import { JobFormDialog } from "@/components/ops/jobs/job-form-dialog";
import { JobStatusPill } from "@/components/ops/jobs/status-badges";
import type { BudgetDetailJob } from "@/data/budget-detail";

type BudgetDetailJobsProps = {
  budgetId: string;
  slug: string;
  jobs: BudgetDetailJob[] | undefined;
  isError: boolean;
  onRetry: () => void;
};

const jobCaption = (job: BudgetDetailJob) => {
  const parts = [job.capturedAt ? `Imagen del ${formatDetailDate(job.capturedAt)}` : "Sin imagen del presupuesto"];
  if (job.hasProducts !== null) parts.push(job.hasProducts ? "con productos" : "sin productos");
  return parts.join(" · ");
};

// Los trabajos que salieron de este presupuesto, con la imagen que guardó cada uno.
export const BudgetDetailJobs = ({ budgetId, slug, jobs, isError, onRetry }: BudgetDetailJobsProps) => {
  const queryClient = useQueryClient();

  return (
    <section className={detailPanelClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-[17px] font-semibold text-ops-text">Trabajos con este presupuesto</h2>
          <p className="text-[13.5px] text-ops-text-muted">
            Cada trabajo guarda una imagen del presupuesto del día en que se vinculó.
          </p>
        </div>
        <JobFormDialog
          defaultSourceBudgetId={budgetId}
          onCreated={() => void queryClient.invalidateQueries({ queryKey: budgetKeys.detailExtras(slug) })}
          triggerLabel="Crear trabajo"
          triggerVariant="outline"
        />
      </div>
      {isError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-ops-border px-3.5 py-3 text-[13.5px] text-ops-text-muted">
          No se pudieron cargar los trabajos.
          <button className="inline-flex h-11 items-center gap-1.5 font-semibold text-ops-bamboo-strong" onClick={onRetry} type="button">
            <RotateCcw className="size-4" />
            Reintentar
          </button>
        </div>
      ) : !jobs ? (
        <div className="h-14 animate-pulse rounded-xl bg-ops-surface-muted" />
      ) : jobs.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ops-border px-3.5 py-3 text-[13.5px] text-ops-text-muted">
          Todavía no hay trabajos hechos con este presupuesto.
        </p>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-xl border border-ops-border">
          {jobs.map((job, index) => (
            <Link
              className={`flex min-h-14 flex-wrap items-center gap-3 px-3.5 py-2 text-ops-text hover:bg-ops-surface-muted ${index ? "border-t border-ops-border" : ""}`}
              href={`/dashboard/jobs/${job.id}`}
              key={job.id}
            >
              <span className="grid size-[34px] flex-none place-items-center rounded-[10px] bg-ops-bamboo-soft text-ops-bamboo-strong">
                <BriefcaseBusiness className="size-[17px]" />
              </span>
              <span className="flex min-w-0 flex-[1_1_200px] flex-col">
                <span className="truncate text-sm font-semibold">{job.name}</span>
                <span className="text-[12.5px] text-ops-text-muted">{jobCaption(job)}</span>
              </span>
              <JobStatusPill status={job.status} />
              <span className="flex flex-col items-end">
                <span className="text-sm font-semibold tabular-nums">{job.price === null ? "Sin opción" : formatBudgetMoney(job.price)}</span>
                <span className="text-xs text-ops-text-muted">{job.budgetIncludesIva ? "con IVA" : "sin IVA"}</span>
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
};

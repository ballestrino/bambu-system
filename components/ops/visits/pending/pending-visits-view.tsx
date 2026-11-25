"use client";

import { useState } from "react";
import { CheckCircle2, SearchX } from "lucide-react";
import { toast } from "sonner";

import { formatDayMonth, type PendingSummary } from "@/lib/ops/pending-visits";
import { DashboardSectionError } from "@/components/ops/dashboard/dashboard-section-error";
import type { DashboardVisitIntent } from "@/components/ops/dashboard/dashboard-agenda-row";
import { usePendingVisitMutations, type PendingVisitsData } from "@/components/ops/hooks/usePendingVisits";
import { JobOccurrenceDialog } from "@/components/ops/jobs/job-occurrence-dialog";
import { OpsEmptyState } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { PendingBulkBar } from "@/components/ops/visits/pending/pending-bulk-bar";
import { PendingConfirmDialog } from "@/components/ops/visits/pending/pending-confirm-dialog";
import { PendingGroupList } from "@/components/ops/visits/pending/pending-group-list";
import { PendingQuickCards } from "@/components/ops/visits/pending/pending-quick-cards";
import type { PendingRowAction } from "@/components/ops/visits/pending/pending-row";
import { PendingToolbar } from "@/components/ops/visits/pending/pending-toolbar";
import { usePendingView } from "@/components/ops/visits/pending/use-pending-view";
import { Skeleton } from "@/components/ui/skeleton";
import { MAX_PENDING_RESOLVE, type PendingResolution } from "@/schemas/ops";

const Intro = ({ summary }: { summary: PendingSummary }) => (
  <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
    <div className="max-w-3xl">
      <h2 className="text-xl font-semibold tracking-tight text-ops-text">Pendientes de registro</h2>
      <p className="mt-1 text-sm leading-relaxed text-ops-text-muted">
        Visitas programadas que ya pasaron y todavía no tienen horario real. Registrá las que se hicieron y descartá
        las que no correspondían. No depende del mes elegido
        {summary.oldestDayKey ? `: están todas, desde el ${formatDayMonth(summary.oldestDayKey)}.` : "."}
      </p>
    </div>
    <dl className="flex gap-5 text-[13px] text-ops-text-muted">
      {[
        [summary.total, "pendientes"],
        [summary.jobCount, "trabajos"],
        [summary.fromRules, "del cronograma"],
      ].map(([value, label]) => (
        <div className="flex flex-col-reverse" key={label}>
          <dt>{label}</dt>
          <dd className="text-xl font-semibold text-ops-text tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  </div>
);

// Vista Pendientes de Visitas (diseño "Inicio Bambú", Pendientes): las
// visitas sin registrar de todas las fechas, agrupadas por trabajo, con
// acciones de a una y en lote.
export const PendingVisitsView = ({
  employees,
  jobId,
  pending,
}: {
  employees: { id: string; name: string }[];
  jobId?: string;
  pending: PendingVisitsData;
}) => {
  const jobScoped = Boolean(jobId);
  const view = usePendingView(pending.visits, pending.todayKey);
  const { isResolving, resolve } = usePendingVisitMutations();
  const [dialog, setDialog] = useState<{ intent: DashboardVisitIntent; visit: OpsOccurrence } | null>(null);
  const [confirm, setConfirm] = useState<{
    action: Exclude<PendingResolution, "ASSIGN">;
    visits: OpsOccurrence[];
  } | null>(null);
  const selected = view.selectedVisits;

  const run = (action: PendingResolution, visits: OpsOccurrence[], employeeId?: string) => {
    if (visits.length > MAX_PENDING_RESOLVE) {
      toast.error(`Elegí hasta ${MAX_PENDING_RESOLVE} visitas por vez`);
      return;
    }
    void resolve({ action, employeeId, jobId, occurrenceIds: visits.map((visit) => visit.id) })
      .then(() => {
        if (visits.length > 1) view.clear();
      })
      .catch(() => undefined);
  };

  const onRowAction = (visit: OpsOccurrence, action: PendingRowAction) => {
    // Eliminar pide confirmacion aun de a una; omitir y cancelar no.
    if (action === "DELETE") setConfirm({ action, visits: [visit] });
    else if (action === "SKIPPED" || action === "CANCELED") run(action, [visit]);
    else setDialog({ intent: action, visit });
  };

  if (pending.error && !pending.hasData) {
    return (
      <DashboardSectionError
        description="No mostramos una lista vacía porque la consulta falló."
        onRetry={pending.refetch}
        title="No pudimos cargar las pendientes"
      />
    );
  }

  return (
    <div className="@container/pending flex flex-col gap-4">
      {!jobScoped ? <Intro summary={pending.summary} /> : null}
      {pending.isLoading || !pending.todayKey ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      ) : !pending.summary.total ? (
        <OpsEmptyState
          description="Todas las visitas que ya pasaron tienen su horario real o están omitidas o canceladas."
          icon={CheckCircle2}
          title="No hay visitas pendientes de registro"
        />
      ) : (
        <>
          <PendingQuickCards jobScoped={jobScoped} onFilter={view.setFilters} summary={pending.summary} />
          <PendingToolbar
            employees={employees}
            filters={view.filters}
            jobScoped={jobScoped}
            onChange={view.setFilters}
            summary={pending.summary}
          />
          {view.filtered.length ? (
            <PendingGroupList isBusy={isResolving} jobScoped={jobScoped} onAction={onRowAction} todayKey={pending.todayKey} view={view} />
          ) : (
            <OpsEmptyState
              description={jobScoped ? "Probá con otra antigüedad u otro equipo." : "Probá con otra antigüedad, otro trabajo u otra empleada."}
              icon={SearchX}
              title="Ninguna pendiente con estos filtros"
            />
          )}
          <PendingBulkBar
            employees={employees}
            isBusy={isResolving}
            onAssign={(employee) => run("ASSIGN", selected, employee.id)}
            onClear={view.clear}
            onResolve={(action) => setConfirm({ action, visits: selected })}
            visits={selected}
          />
        </>
      )}

      <PendingConfirmDialog
        action={confirm?.action ?? null}
        count={confirm?.visits.length ?? 0}
        isBusy={isResolving}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) run(confirm.action, confirm.visits);
          setConfirm(null);
        }}
      />
      {dialog ? (
        <JobOccurrenceDialog
          intent={dialog.intent}
          jobId={jobId}
          key={`${dialog.visit.id}-${dialog.intent}`}
          occurrence={dialog.visit}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          open
        />
      ) : null}
    </div>
  );
};

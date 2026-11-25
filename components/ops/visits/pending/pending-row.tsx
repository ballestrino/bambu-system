"use client";

import { Ban, Clock3, Pencil, SkipForward, Trash2, UserPlus } from "lucide-react";

import { formatPendingAge, formatShortDay, getPendingAge, getPendingAgeDays } from "@/lib/ops/pending-visits";
import { formatVisitRange, getVisitDayKey, getVisitEmployees } from "@/lib/ops/visit-day";
import type { DashboardVisitIntent } from "@/components/ops/dashboard/dashboard-agenda-row";
import { JobsCheckbox } from "@/components/ops/jobs/jobs-checkbox";
import { OpsActionMenu, opsAttention, opsToneClasses } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { VisitAvatar } from "@/components/ops/visits/visit-bits";
import { cn } from "@/lib/utils";

export type PendingRowAction = DashboardVisitIntent | "CANCELED" | "DELETE" | "SKIPPED";

// Casilla, fecha, horario, equipo, antiguedad y acciones; en angosto se apila.
export const pendingGridClass =
  "grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-x-3 @3xl/pending:grid-cols-[44px_130px_120px_minmax(0,1fr)_120px_168px]";

const chip = "inline-flex h-[22px] items-center rounded-full border px-2 text-[11.5px] font-semibold whitespace-nowrap";

const ageTone = {
  month: opsAttention.chip,
  old: "border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-500/60 dark:bg-amber-500/25 dark:text-amber-100",
  today: opsToneClasses.neutral,
  week: opsToneClasses.neutral,
};

export const PendingRow = ({
  isBusy,
  onAction,
  onToggle,
  selected,
  todayKey,
  visit,
}: {
  isBusy: boolean;
  onAction: (visit: OpsOccurrence, action: PendingRowAction) => void;
  onToggle: () => void;
  selected: boolean;
  todayKey: string;
  visit: OpsOccurrence;
}) => {
  const employees = getVisitEmployees(visit);
  const days = getPendingAgeDays(visit, todayKey);
  const date = formatShortDay(getVisitDayKey(visit.scheduledStartAt));
  const team = employees.length ? (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <VisitAvatar className="size-[26px] text-[10.5px]" name={employees[0].name} />
      <span className="truncate">{employees.map((employee) => employee.name).join(", ")}</span>
    </span>
  ) : (
    <span className={cn("inline-flex items-center gap-1.5 font-semibold", opsAttention.text)}>
      <VisitAvatar className="size-[26px] text-[10.5px]" name="" unassigned />
      Sin asignar
    </span>
  );

  return (
    <div className={cn(pendingGridClass, "border-t border-ops-surface-muted py-1 pr-3 pl-1 text-[13.5px] text-ops-text @3xl/pending:pr-4", selected && "bg-ops-bamboo-soft/60")}>
      <label className="flex size-11 cursor-pointer items-center justify-center">
        <JobsCheckbox checked={selected} label={`Seleccionar ${visit.job.name} del ${date}`} onCheckedChange={onToggle} />
      </label>
      <div className="flex min-w-0 flex-col gap-1 py-1.5 @3xl/pending:contents">
        <span className="font-semibold">{date}</span>
        <span className="text-ops-text-muted tabular-nums @3xl/pending:text-ops-text">{formatVisitRange(visit)}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          {team}
          <span className={cn(chip, ageTone[getPendingAge(days)], "@3xl/pending:hidden")}>{formatPendingAge(days)}</span>
        </span>
        <span className="hidden @3xl/pending:block">
          <span className={cn(chip, ageTone[getPendingAge(days)])}>{formatPendingAge(days)}</span>
        </span>
      </div>
      <span className="flex items-center justify-end gap-1">
        <button
          className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-ops-border bg-ops-surface px-3 text-[12.5px] font-semibold text-ops-text hover:bg-ops-surface-muted disabled:opacity-50"
          disabled={isBusy}
          onClick={() => onAction(visit, employees.length ? "complete" : "schedule")}
          type="button"
        >
          {employees.length ? <Clock3 className="size-3.5" /> : <UserPlus className="size-3.5" />}
          {employees.length ? "Registrar" : "Asignar"}
        </button>
        <OpsActionMenu
          items={[
            { icon: Pencil, label: "Editar visita", onSelect: () => onAction(visit, "schedule") },
            { disabled: isBusy, icon: SkipForward, label: "Marcar omitida", onSelect: () => onAction(visit, "SKIPPED"), separated: true },
            { disabled: isBusy, icon: Ban, label: "Cancelar visita", onSelect: () => onAction(visit, "CANCELED") },
            { disabled: isBusy, icon: Trash2, label: "Eliminar visita", onSelect: () => onAction(visit, "DELETE"), separated: true, variant: "destructive" },
          ]}
          label={`Más acciones de ${visit.job.name} del ${date}`}
        />
      </span>
    </div>
  );
};

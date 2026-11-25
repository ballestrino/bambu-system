"use client";

import Link from "next/link";
import { Clock3, UserPlus, UserRound, UserX } from "lucide-react";

import type { HomeVisitState } from "@/lib/ops/home-week";
import { formatActualRange, formatVisitRange, getVisitDayKey, getVisitEmployees, getVisitTitle } from "@/lib/ops/visit-day";
import { opsAttention, opsToneClasses } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { VisitStatusBadge } from "@/components/ops/visits/visit-bits";
import { cn } from "@/lib/utils";

export type DashboardVisitIntent = "complete" | "schedule";

const chip = "inline-flex h-[22px] items-center gap-1.5 rounded-full border px-2 text-[11.5px] font-semibold whitespace-nowrap";
const button = "inline-flex h-10 shrink-0 items-center gap-[7px] rounded-[10px] px-3.5 text-[13px] font-semibold";
const primary = `${button} bg-ops-bamboo-strong text-white hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas`;
const outline = `${button} border border-ops-border bg-ops-surface text-ops-text hover:bg-ops-surface-muted`;

const StateChip = ({ state, visit }: { state: HomeVisitState; visit: OpsOccurrence }) => {
  if (state === "ended") return <span className={cn(chip, opsAttention.chip)}>Terminó · falta registrar</span>;
  if (state === "ongoing") {
    return (
      <span className={cn(chip, opsToneClasses.active)}>
        <span className="size-1.5 rounded-full bg-ops-bamboo" />
        En curso
      </span>
    );
  }
  if (state === "upcoming") return <span className={cn(chip, opsToneClasses.neutral)}>Programada</span>;
  if (state === "done") {
    return <span className={cn(chip, opsToneClasses.success)}>Realizada {formatActualRange(visit) ?? ""}</span>;
  }
  if (state === "off") return <VisitStatusBadge status={visit.status} />;
  return null;
};

// Una visita de la agenda de Inicio: horario, trabajo, equipo, estado y la
// accion que pide ahora (registrar la que termino, asignar la sin equipo).
export const DashboardAgendaRow = ({
  onAction,
  state,
  visit,
}: {
  onAction: (visit: OpsOccurrence, intent: DashboardVisitIntent) => void;
  state: HomeVisitState;
  visit: OpsOccurrence;
}) => {
  const employees = getVisitEmployees(visit);
  const unassigned = state === "unassigned";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3.5 gap-y-2.5 rounded-[var(--ops-radius-row)] border px-3 py-2.5",
        unassigned ? opsAttention.card : "border-ops-border bg-ops-surface"
      )}
    >
      <span
        className={cn(
          "rounded-lg px-2.5 py-[5px] text-[12.5px] font-semibold whitespace-nowrap text-ops-text tabular-nums",
          unassigned ? "bg-amber-100 dark:bg-amber-500/20" : "bg-ops-surface-muted"
        )}
      >
        {formatVisitRange(visit)}
      </span>
      <div className="flex min-w-0 flex-[1_1_200px] flex-col gap-[3px]">
        <span className="truncate text-sm font-semibold text-ops-text">{getVisitTitle(visit)}</span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-ops-text-muted">
          {employees.length ? (
            <span className="inline-flex items-center gap-1.5">
              <UserRound aria-hidden className="size-[13px]" />
              {employees.map((employee) => employee.name).join(", ")}
            </span>
          ) : (
            <span className={cn("inline-flex items-center gap-1.5 font-semibold", opsAttention.text)}>
              <UserX aria-hidden className="size-[13px]" />
              Sin asignar
            </span>
          )}
          <StateChip state={state} visit={visit} />
        </span>
      </div>
      {state === "ended" || state === "ongoing" ? (
        <button className={state === "ended" ? primary : outline} onClick={() => onAction(visit, "complete")} type="button">
          <Clock3 className="size-[15px]" />
          {state === "ended" ? "Registrar horario" : "Registrar"}
        </button>
      ) : unassigned ? (
        <button className={primary} onClick={() => onAction(visit, "schedule")} type="button">
          <UserPlus className="size-[15px]" />
          Asignar
        </button>
      ) : (
        <Link
          className={cn(button, "text-ops-bamboo-strong hover:bg-ops-surface-muted")}
          href={`/dashboard/calendar?vista=agenda&dia=${getVisitDayKey(visit.scheduledStartAt)}&visita=${visit.id}`}
        >
          Ver detalle
        </Link>
      )}
    </div>
  );
};

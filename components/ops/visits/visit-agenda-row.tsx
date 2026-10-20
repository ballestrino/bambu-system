"use client";

import { Pencil, UserRoundX, UsersRound } from "lucide-react";

import { formatVisitRange, getVisitEmployees, getVisitTitle, isAttentionVisit } from "@/lib/ops/visit-day";
import type { OpsOccurrence } from "@/components/ops/types";
import { VisitStatusBadge } from "@/components/ops/visits/visit-bits";
import { getVisitAction, getVisitTeamLabel, type VisitActionKind } from "@/components/ops/visits/visit-view-model";
import { cn } from "@/lib/utils";

const actionClass =
  "inline-flex h-[34px] w-[156px] shrink-0 items-center justify-center gap-1.5 rounded-[9px] text-[12.5px] font-semibold whitespace-nowrap transition-colors";

// Fila de la agenda (3a): rango, trabajo y equipo, estado y la accion que pide.
export const VisitAgendaRow = ({
  onAction,
  onSelect,
  selected,
  visit,
}: {
  onAction: (kind: VisitActionKind) => void;
  onSelect: () => void;
  selected: boolean;
  visit: OpsOccurrence;
}) => {
  const action = getVisitAction(visit);
  const unassigned = !getVisitEmployees(visit).length;
  const TeamIcon = unassigned ? UserRoundX : UsersRound;
  const ActionIcon = action.icon;

  return (
    <div
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors hover:border-ops-bamboo",
        selected
          ? "border-ops-bamboo-strong bg-ops-bamboo-soft/60"
          : isAttentionVisit(visit)
            ? "border-amber-300 bg-ops-surface dark:border-amber-500/40"
            : "border-ops-border bg-ops-surface",
        visit.status === "SKIPPED" || visit.status === "CANCELED" ? "opacity-80" : null
      )}
      onClick={onSelect}
    >
      <span className="inline-flex h-[26px] shrink-0 items-center rounded-full bg-ops-bamboo-soft px-2.5 text-xs font-semibold text-ops-bamboo-strong tabular-nums">
        {formatVisitRange(visit)}
      </span>
      <button className="flex min-w-0 flex-1 flex-col gap-0.5 text-left" type="button">
        <span className="truncate text-sm font-semibold text-ops-text">{getVisitTitle(visit)}</span>
        <span
          className={cn(
            "flex min-w-0 items-center gap-1.5 text-[12.5px]",
            unassigned ? "text-amber-800 dark:text-amber-200" : "text-ops-text/75"
          )}
        >
          <TeamIcon className="size-[13px] shrink-0" aria-hidden />
          <span className="truncate">{getVisitTeamLabel(visit)}</span>
        </span>
      </button>
      <VisitStatusBadge status={visit.status} />
      {action.kind === "editar" ? (
        <button
          className={cn(actionClass, "border border-ops-border text-ops-text hover:bg-ops-surface-muted")}
          onClick={(event) => {
            event.stopPropagation();
            onAction("editar");
          }}
          type="button"
        >
          <Pencil className="size-[13px]" />
          Editar
        </button>
      ) : (
        <button
          className={cn(actionClass, "bg-ops-bamboo-strong text-white hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas")}
          onClick={(event) => {
            event.stopPropagation();
            onAction(action.kind);
          }}
          type="button"
        >
          <ActionIcon className="size-3.5" />
          {action.label}
        </button>
      )}
    </div>
  );
};

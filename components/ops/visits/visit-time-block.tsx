"use client";

import { TriangleAlert } from "lucide-react";

import {
  formatVisitRange,
  getTimeGridBox,
  getVisitEmployees,
  getVisitMinutes,
  getVisitTitle,
  isAttentionVisit,
} from "@/lib/ops/visit-day";
import { opsVisitBlock } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import {
  getVisitAction,
  getVisitPartners,
  getVisitSubline,
  type VisitActionKind,
} from "@/components/ops/visits/visit-view-model";
import { cn } from "@/lib/utils";

// Bloque de una visita en la grilla horaria del dia (3a "Dia por empleada").
export const VisitTimeBlock = ({
  employeeId,
  hourPx,
  onAction,
  onOpen,
  selected,
  visit,
}: {
  employeeId: string | null;
  hourPx: number;
  onAction: (kind: VisitActionKind) => void;
  onOpen: () => void;
  selected: boolean;
  visit: OpsOccurrence;
}) => {
  const unassigned = !getVisitEmployees(visit).length;
  const look = unassigned ? opsVisitBlock.unassigned : opsVisitBlock[visit.status];
  const box = getTimeGridBox(getVisitMinutes(visit), hourPx);
  const action = getVisitAction(visit);
  const ActionIcon = action.icon;
  const partners = employeeId ? getVisitPartners(visit, employeeId) : null;

  return (
    <div
      className={cn(
        "absolute inset-x-[5px] flex cursor-pointer flex-col gap-0.5 overflow-hidden rounded-lg border border-l-[3px] px-2 py-[5px] text-left transition-shadow hover:shadow-[0_4px_12px_rgb(24_37_29/0.12)]",
        look.block,
        look.bar,
        selected && "ring-2 ring-ops-bamboo-strong"
      )}
      onClick={onOpen}
      style={{ height: box.height, top: box.top }}
    >
      <span className={cn("flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap tabular-nums", look.time)}>
        {formatVisitRange(visit)}
        {isAttentionVisit(visit) ? <TriangleAlert className="size-3 text-ops-amber" /> : null}
      </span>
      <button className="text-left text-[12.5px] leading-tight font-semibold text-ops-text" type="button">
        {getVisitTitle(visit)}
      </button>
      <span className="truncate text-[11px] text-ops-text-muted">{partners ?? getVisitSubline(visit)}</span>
      {action.kind !== "editar" && box.height >= 92 ? (
        <span
          className="mt-auto inline-flex h-6 items-center justify-center gap-1.5 rounded-md bg-ops-bamboo-strong text-[11.5px] font-semibold whitespace-nowrap text-white dark:text-ops-canvas"
          onClick={(event) => {
            event.stopPropagation();
            onAction(action.kind);
          }}
          role="button"
          tabIndex={-1}
        >
          <ActionIcon className="size-3" />
          {action.label}
        </span>
      ) : null}
    </div>
  );
};

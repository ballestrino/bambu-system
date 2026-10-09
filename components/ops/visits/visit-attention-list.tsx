"use client";

import { TriangleAlert, UserPlus } from "lucide-react";

import { formatMinuteOfDay } from "@/lib/ops/minute-ranges";
import { getVisitEmployees, getVisitMinutes, getVisitTitle } from "@/lib/ops/visit-day";
import { opsAttention } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { getAttentionReason } from "@/components/ops/visits/visit-view-model";
import { cn } from "@/lib/utils";

// "Requiere atencion" del dia elegido, al costado de la grilla (3a).
export const VisitAttentionList = ({
  onAssign,
  onOpen,
  visits,
}: {
  onAssign: (visit: OpsOccurrence) => void;
  onOpen: (visit: OpsOccurrence) => void;
  visits: OpsOccurrence[];
}) => (
  <section className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-3.5">
    <div className="flex items-center gap-2">
      <TriangleAlert className="size-[15px] text-ops-amber" />
      <span className="flex-1 text-sm font-semibold text-ops-text">Requiere atención</span>
      <span className={cn("flex h-[22px] min-w-[22px] items-center justify-center rounded-full border px-[7px] text-xs font-semibold", opsAttention.chip)}>
        {visits.length}
      </span>
    </div>
    <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
      {visits.length ? (
        visits.map((visit) => (
          <div
            className={cn("flex flex-none cursor-pointer flex-col gap-1.5 rounded-xl border px-3 py-2.5 hover:border-amber-300", opsAttention.card)}
            key={visit.id}
            onClick={() => onOpen(visit)}
          >
            <div className="flex items-baseline justify-between gap-2">
              <button className="min-w-0 flex-1 text-left text-[13px] leading-tight font-semibold text-ops-text" type="button">
                {getVisitTitle(visit)}
              </button>
              <span className="text-xs text-ops-text-muted tabular-nums">
                {formatMinuteOfDay(getVisitMinutes(visit).startMinute)}
              </span>
            </div>
            <span className={cn("text-xs", opsAttention.text)}>{getAttentionReason(visit)}</span>
            {getVisitEmployees(visit).length ? null : (
              <button
                className="inline-flex h-[30px] items-center gap-1.5 self-start rounded-lg bg-ops-bamboo-strong px-2.5 text-xs font-semibold text-white dark:text-ops-canvas"
                onClick={(event) => {
                  event.stopPropagation();
                  onAssign(visit);
                }}
                type="button"
              >
                <UserPlus className="size-3.5" />
                Asignar
              </button>
            )}
          </div>
        ))
      ) : (
        <p className="text-[13px] text-ops-text-muted">Nada pendiente este día.</p>
      )}
    </div>
  </section>
);

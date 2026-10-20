"use client";

import type { ComponentProps } from "react";
import { GripVertical, TriangleAlert } from "lucide-react";

import type { ScheduleVisit } from "@/lib/ops/schedule-types";
import { opsVisitBlock } from "@/components/ops/shared";
import { cn } from "@/lib/utils";

// Tarjeta de una visita en el cronograma (3a): barra lateral por estado, hora
// y nombre. El asa de la izquierda la arrastra a otro dia o empleada.
export const ScheduleVisitCard = ({
  handleProps,
  isDragging,
  onEdit,
  unassigned = false,
  visit,
  warnings = [],
}: {
  handleProps?: ComponentProps<"button">;
  isDragging?: boolean;
  onEdit?: () => void;
  unassigned?: boolean;
  visit: ScheduleVisit;
  warnings?: string[];
}) => {
  const look = unassigned ? opsVisitBlock.unassigned : opsVisitBlock[visit.status];
  const hasAlias = visit.displayName !== visit.jobName;
  const warningLabel = warnings.join(" · ");
  const title = [
    `${visit.startLabel} – ${visit.endLabel} · ${visit.displayName}`,
    hasAlias ? visit.jobName : null,
    visit.address,
    visit.teammates.length ? `Con ${visit.teammates.join(", ")}` : null,
    warningLabel || null,
  ].filter(Boolean).join("\n");

  return (
    <div
      className={cn(
        "group/card flex min-w-0 items-stretch rounded-lg border border-l-[3px]",
        look.block,
        look.bar,
        isDragging && "opacity-40 ring-1 ring-ops-bamboo"
      )}
      title={title}
    >
      {handleProps ? (
        <button
          aria-label={`Mover ${visit.displayName}`}
          className="flex w-3.5 shrink-0 cursor-grab touch-none items-center justify-center text-ops-text-muted/40 hover:text-ops-bamboo-strong active:cursor-grabbing"
          type="button"
          {...handleProps}
        >
          <GripVertical className="size-3" />
        </button>
      ) : null}
      <button className="flex min-w-0 flex-1 flex-col gap-px py-[5px] pr-[7px] text-left" onClick={onEdit} type="button">
        <span className={cn("flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap tabular-nums", look.time)}>
          {visit.startLabel}–{visit.endLabel}
          {warnings.length ? (
            <>
              <TriangleAlert aria-hidden className="size-[11px] text-ops-amber" />
              <span className="sr-only">{warningLabel}</span>
            </>
          ) : null}
        </span>
        <span className="truncate text-xs font-medium text-ops-text">{visit.displayName}</span>
      </button>
    </div>
  );
};

"use client";

import type { ComponentProps } from "react";
import { GripVertical, MapPin, TriangleAlert, Users } from "lucide-react";

import type { ScheduleVisit } from "@/lib/ops/schedule-types";
import {
  getOpsStatusConfig,
  opsOccurrenceStatus,
  opsToneClasses,
} from "@/components/ops/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ScheduleVisitCard = ({
  handleProps,
  isDragging,
  onEdit,
  showDetails = true,
  visit,
  warnings = [],
}: {
  handleProps?: ComponentProps<"button">;
  isDragging?: boolean;
  onEdit?: () => void;
  showDetails?: boolean;
  visit: ScheduleVisit;
  warnings?: string[];
}) => {
  const status = getOpsStatusConfig(opsOccurrenceStatus, visit.status);
  const isOff = visit.status === "CANCELED" || visit.status === "SKIPPED";
  const hasAlias = visit.displayName !== visit.jobName;
  const warningLabel = warnings.join(" · ");

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-1 rounded-[var(--ops-radius-row)] border border-ops-border bg-ops-surface p-1.5 text-left",
        isDragging && "opacity-40 ring-1 ring-ops-bamboo",
        isOff && "opacity-60",
        // El aviso se ve, pero no compite con el estado de la visita.
        warnings.length && "border-l-2 border-l-amber-400 dark:border-l-amber-500/70"
      )}
    >
      {handleProps ? (
        <button
          aria-label={`Mover ${visit.displayName}`}
          className="mt-0.5 shrink-0 cursor-grab touch-none rounded p-0.5 text-muted-foreground/50 hover:text-ops-bamboo-strong active:cursor-grabbing"
          type="button"
          {...handleProps}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
      ) : null}
      <button
        className="min-w-0 flex-1 space-y-0.5 text-left"
        onClick={onEdit}
        type="button"
      >
        <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span className="text-xs font-semibold text-ops-text">
            {visit.startLabel} - {visit.endLabel}
          </span>
          {warnings.length ? (
            <span className="inline-flex items-center" title={warningLabel}>
              <TriangleAlert
                aria-hidden
                className="h-3.5 w-3.5 shrink-0 text-amber-500 dark:text-amber-400"
              />
              <span className="sr-only">{warningLabel}</span>
            </span>
          ) : null}
          {isOff ? (
            <Badge
              variant="outline"
              className={cn("border px-1.5 py-0 text-[10px]", opsToneClasses[status.tone])}
            >
              {status.label}
            </Badge>
          ) : null}
        </span>
        <span className="block break-words text-xs font-medium text-ops-text">
          {visit.displayName}
        </span>
        {hasAlias ? (
          <span className="block break-words text-[11px] text-muted-foreground/70">
            {visit.jobName}
          </span>
        ) : null}
        {warnings.length && showDetails ? (
          <span className="block break-words text-[11px] text-amber-700 dark:text-amber-300">
            {warningLabel}
          </span>
        ) : null}
        {showDetails ? (
          <>
            <span className="flex min-w-0 items-start gap-1 text-[11px] text-muted-foreground">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="break-words">{visit.address}</span>
            </span>
            {visit.teammates.length ? (
              <span className="flex min-w-0 items-start gap-1 text-[11px] text-muted-foreground">
                <Users className="mt-0.5 h-3 w-3 shrink-0" />
                <span className="break-words">{visit.teammates.join(", ")}</span>
              </span>
            ) : null}
          </>
        ) : null}
      </button>
    </div>
  );
};

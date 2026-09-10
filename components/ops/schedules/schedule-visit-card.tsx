"use client";

import { MapPin, Users } from "lucide-react";

import type { ScheduleVisit } from "@/lib/ops/schedule-types";
import {
  getOpsStatusConfig,
  opsOccurrenceStatus,
  opsSurface,
  opsToneClasses,
} from "@/components/ops/shared";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const ScheduleVisitCard = ({
  compact = false,
  visit,
}: {
  compact?: boolean;
  visit: ScheduleVisit;
}) => {
  const status = getOpsStatusConfig(opsOccurrenceStatus, visit.status);
  const isOff = visit.status === "CANCELED" || visit.status === "SKIPPED";

  return (
    <div
      className={cn(
        opsSurface.panelSoft,
        "min-w-0 space-y-1 p-2",
        isOff && "opacity-60"
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className="text-xs font-semibold text-ops-text">
          {visit.startLabel} - {visit.endLabel}
        </span>
        {isOff ? (
          <Badge
            variant="outline"
            className={cn("border px-1.5 py-0 text-[10px]", opsToneClasses[status.tone])}
          >
            {status.label}
          </Badge>
        ) : null}
      </div>
      <p className="min-w-0 break-words text-xs font-medium text-ops-text">
        {visit.jobName}
      </p>
      {compact ? null : (
        <>
          <p className="flex min-w-0 items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="break-words">{visit.address}</span>
          </p>
          <p className="flex min-w-0 items-start gap-1 text-xs text-muted-foreground">
            <Users className="mt-0.5 h-3 w-3 shrink-0" />
            <span className="break-words">
              {visit.teammates.length ? visit.teammates.join(", ") : "Sin compañeras"}
            </span>
          </p>
        </>
      )}
    </div>
  );
};

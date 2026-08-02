import { AlertTriangle, UsersRound } from "lucide-react";

import { needsOccurrenceAttention } from "@/components/ops/calendar/calendar-utils";
import { getOccurrenceEmployeesLabel } from "@/components/ops/jobs/occurrence-employees";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import { opsSurface } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { formatDate, formatTime } from "@/components/ops/utils";
import { VisitItemActions } from "@/components/ops/visits/visit-item-actions";

export const VisitListRow = ({ occurrence }: { occurrence: OpsOccurrence }) => {
  const needsAttention = needsOccurrenceAttention(occurrence);

  return (
    <article
      className={`${opsSurface.panel} grid items-center gap-3 p-3 transition-colors hover:border-[#53985E]/35 lg:grid-cols-[9rem_8rem_minmax(10rem,1fr)_minmax(12rem,1fr)_auto_auto]`}
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Fecha</p>
        <p className="text-sm font-semibold">{formatDate(occurrence.scheduledStartAt)}</p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Horario</p>
        <p className="text-sm font-medium">
          {formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Trabajo</p>
        <p className="truncate text-sm font-semibold">{occurrence.job.name}</p>
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">Equipo</p>
        <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
          <UsersRound className="h-3.5 w-3.5 shrink-0" />
          {getOccurrenceEmployeesLabel(occurrence)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <OccurrenceStatusBadge status={occurrence.status} />
        {needsAttention ? (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            Atención
          </span>
        ) : null}
      </div>
      <VisitItemActions occurrence={occurrence} />
    </article>
  );
};

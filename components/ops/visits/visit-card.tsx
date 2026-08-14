import { AlertTriangle, CalendarClock, Clock3, UsersRound } from "lucide-react";

import { needsOccurrenceAttention } from "@/components/ops/calendar/calendar-utils";
import { getOccurrenceEmployeesLabel } from "@/components/ops/jobs/occurrence-employees";
import { OccurrenceStatusBadge } from "@/components/ops/jobs/status-badges";
import { opsSurface } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { formatDate, formatTime } from "@/components/ops/utils";
import { VisitItemActions } from "@/components/ops/visits/visit-item-actions";

export const VisitCard = ({ occurrence }: { occurrence: OpsOccurrence }) => (
  <article className={`${opsSurface.panel} flex min-h-72 flex-col gap-4 p-4`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[#53985E]">
          {formatDate(occurrence.scheduledStartAt)}
        </p>
        <h3 className="truncate text-lg font-semibold text-[#18251D] dark:text-[#F0F3E8]">
          {occurrence.job.name}
        </h3>
      </div>
      <OccurrenceStatusBadge status={occurrence.status} />
    </div>

    <div className="grid gap-3 text-sm sm:grid-cols-2">
      <div className="rounded-md bg-[#F7FBF7] p-3 dark:bg-[#91AD71]/10">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarClock className="h-3.5 w-3.5" /> Planificado
        </p>
        <p className="mt-1 font-semibold">
          {formatTime(occurrence.scheduledStartAt)} - {formatTime(occurrence.scheduledEndAt)}
        </p>
      </div>
      <div className="rounded-md bg-muted/40 p-3">
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock3 className="h-3.5 w-3.5" /> Real
        </p>
        <p className="mt-1 font-semibold">
          {formatTime(occurrence.actualStartAt)} - {formatTime(occurrence.actualEndAt)}
        </p>
      </div>
    </div>

    <div className="space-y-2 text-sm text-muted-foreground">
      <p className="flex items-start gap-2">
        <UsersRound className="mt-0.5 h-4 w-4 shrink-0" />
        {getOccurrenceEmployeesLabel(occurrence)}
      </p>
      <p>
        {occurrence.isDetached
          ? "Separada de la regla"
          : occurrence.scheduleRuleId
            ? "Ligada a una regla recurrente"
            : "Visita manual"}
      </p>
      <p className="line-clamp-2">{occurrence.notes || "Sin notas para esta visita."}</p>
    </div>

    {needsOccurrenceAttention(occurrence) ? (
      <p className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4" /> Requiere atención operativa
      </p>
    ) : null}

    <div className="mt-auto border-t border-[#53985E]/10 pt-3">
      <VisitItemActions occurrence={occurrence} />
    </div>
  </article>
);

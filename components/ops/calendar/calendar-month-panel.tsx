import { CalendarDays, CalendarPlus, CheckCircle2, Clock3 } from "lucide-react";

import type { OpsOccurrence } from "@/components/ops/types";
import { getCalendarStats } from "@/components/ops/calendar/calendar-utils";
import { GenerateOccurrencesDialog } from "@/components/ops/occurrences/generate-occurrences-dialog";
import { OpsMetricCard, opsSurface } from "@/components/ops/shared";
import { Calendar } from "@/components/ui/calendar";
import {
  monthPreset,
  untilMonthEndPreset,
  weekPreset,
} from "@/lib/ops/occurrence-generation-presets";
import { toLocalDateKey } from "@/lib/ops/schedule-week";
import { DEFAULT_OPS_TIMEZONE, getLocalDate } from "@/lib/ops/timezone";
import { cn } from "@/lib/utils";

export const CalendarMonthPanel = ({
  month,
  monthIsEmpty,
  occurrences,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: {
  month: Date;
  // The month has no visits at all, filters aside (and it finished loading).
  monthIsEmpty: boolean;
  occurrences: OpsOccurrence[];
  selectedDate?: Date;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date?: Date) => void;
}) => {
  const stats = getCalendarStats(occurrences);
  // The selected day, or the first of the visible month.
  const dayKey = toLocalDateKey(getLocalDate(selectedDate ?? month, DEFAULT_OPS_TIMEZONE));

  return (
    <section className={cn(opsSurface.panel, "space-y-4 p-4 md:p-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#18251D] dark:text-[#F0F3E8]">
            Mes operativo
          </h2>
          <p className="text-sm text-muted-foreground">
            Selecciona un día para revisar y actuar.
          </p>
        </div>
        <GenerateOccurrencesDialog
          presets={[
            weekPreset(dayKey, "Semana del día"),
            monthPreset(dayKey, "Todo el mes"),
            untilMonthEndPreset(dayKey, "Del día a fin de mes"),
          ]}
          scopeLabel="todos los trabajos"
        />
      </div>
      {monthIsEmpty ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarPlus aria-hidden className="h-3.5 w-3.5 shrink-0" />
          Este mes no tiene visitas generadas. Usá &quot;Generar visitas&quot; para crearlas.
        </p>
      ) : null}
      <Calendar
        mode="single"
        month={month}
        onMonthChange={onMonthChange}
        selected={selectedDate}
        onSelect={onSelectDate}
        modifiers={{
          scheduled: stats.scheduledDates,
          done: stats.doneDates,
          attention: stats.attentionDates,
        }}
        modifiersClassNames={{
          scheduled: "bg-[#EAF5EC] text-[#244C2D] font-semibold dark:bg-[#364B32]/80 dark:text-[#F0F3E8]",
          done: "bg-emerald-100 text-emerald-800 font-semibold dark:bg-emerald-500/20 dark:text-emerald-100",
          attention: "bg-amber-100 text-amber-900 font-semibold dark:bg-amber-500/20 dark:text-amber-100",
        }}
        className="mx-auto rounded-md bg-transparent p-0 [--cell-size:2.75rem] sm:[--cell-size:3rem]"
      />
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-[#EAF5EC] px-3 py-1 text-[#244C2D] dark:bg-[#364B32]/80 dark:text-[#F0F3E8]">
          Programadas
        </span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-100">
          Realizadas
        </span>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100">
          Atención
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:hidden">
        <OpsMetricCard className="min-w-0 p-2" label="Visitas" value={stats.total} size="compact" />
        <OpsMetricCard className="min-w-0 p-2" label="Realizadas" value={stats.doneCount} size="compact" />
        <OpsMetricCard className="min-w-0 p-2" label="Pendientes" value={stats.pendingCount} size="compact" />
      </div>
      <div className="hidden gap-3 sm:grid sm:grid-cols-3 xl:grid-cols-1">
        <OpsMetricCard label="Visitas" value={stats.total} icon={CalendarDays} tone="active" />
        <OpsMetricCard label="Realizadas" value={stats.doneCount} icon={CheckCircle2} tone="success" />
        <OpsMetricCard label="Pendientes" value={stats.pendingCount} icon={Clock3} tone="warning" />
      </div>
    </section>
  );
};

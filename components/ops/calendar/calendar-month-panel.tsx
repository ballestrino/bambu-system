import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

import type { OpsOccurrence } from "@/components/ops/types";
import { getCalendarStats } from "@/components/ops/calendar/calendar-utils";
import { OpsMetricCard, opsSurface } from "@/components/ops/shared";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export const CalendarMonthPanel = ({
  month,
  occurrences,
  selectedDate,
  onMonthChange,
  onSelectDate,
}: {
  month: Date;
  occurrences: OpsOccurrence[];
  selectedDate?: Date;
  onMonthChange: (date: Date) => void;
  onSelectDate: (date?: Date) => void;
}) => {
  const stats = getCalendarStats(occurrences);

  return (
    <section className={cn(opsSurface.panel, "space-y-4 p-4 md:p-5")}>
      <div>
        <h2 className="text-lg font-semibold text-[#18251D] dark:text-[#F0F3E8]">
          Mes operativo
        </h2>
        <p className="text-sm text-muted-foreground">
          Selecciona un día para revisar y actuar.
        </p>
      </div>
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

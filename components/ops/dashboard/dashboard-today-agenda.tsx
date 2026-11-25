"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { getHomeVisitState, type HomeVisitState } from "@/lib/ops/home-week";
import { formatMinuteOfDay } from "@/lib/ops/minute-ranges";
import { formatDayLabel, getWeekDays } from "@/lib/ops/visit-calendar";
import { getVisitMinutes, groupVisitsByHour, plural, type VisitDayTotals, type VisitHourGroup } from "@/lib/ops/visit-day";
import { DashboardAgendaRow, type DashboardVisitIntent } from "@/components/ops/dashboard/dashboard-agenda-row";
import { DashboardSectionError } from "@/components/ops/dashboard/dashboard-section-error";
import { OpsEmptyState } from "@/components/ops/shared";
import type { OpsOccurrence } from "@/components/ops/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const NowLine = ({ minute }: { minute: number }) => (
  <li className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3">
    <span className="text-right text-xs font-bold text-amber-700 tabular-nums dark:text-amber-300">{formatMinuteOfDay(minute)}</span>
    <span className="flex items-center gap-2">
      <span className="-ml-1.5 size-2.5 rounded-full bg-amber-600" />
      <span className="h-0.5 flex-1 bg-amber-300 dark:bg-amber-500/50" />
      <span className="text-[11.5px] font-semibold text-amber-800 dark:text-amber-200">Ahora</span>
    </span>
  </li>
);

// Agenda de Inicio (diseño "Inicio Bambú", Main): tira de la semana actual y
// las visitas del dia elegido por hora, con la linea de "ahora" si es hoy.
export const DashboardTodayAgenda = ({
  dayKey,
  error,
  isLoading,
  nowMinute,
  onAction,
  onPickDay,
  onRetry,
  todayKey,
  tomorrowCount,
  totals,
  visits,
}: {
  dayKey: string | null;
  error: unknown;
  isLoading: boolean;
  nowMinute: number | null;
  onAction: (visit: OpsOccurrence, intent: DashboardVisitIntent) => void;
  onPickDay: (dayKey: string) => void;
  onRetry: () => Promise<unknown> | void;
  todayKey: string | null;
  tomorrowCount: number;
  totals: Map<string, VisitDayTotals>;
  visits: OpsOccurrence[];
}) => {
  const isToday = Boolean(dayKey) && dayKey === todayKey;
  const groups = groupVisitsByHour(visits);
  const states = new Map(visits.map((visit) => [visit.id, getHomeVisitState(visit, { nowMinute: isToday ? nowMinute : null, todayKey: todayKey ?? "" })]));
  const waiting = [...states.values()].filter((state) => state === "ended" || state === "unassigned").length;
  const ongoing = [...states.values()].filter((state) => state === "ongoing").length;
  const nowIndex = isToday && nowMinute !== null ? groups.findIndex((group) => getVisitMinutes(group.items[0]).startMinute > nowMinute) : -1;
  const showNowAtEnd = isToday && nowMinute !== null && nowIndex === -1 && groups.length > 0;

  return (
    <section aria-labelledby="agenda-titulo" className="flex min-w-0 flex-col gap-4 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-semibold text-ops-text" id="agenda-titulo">
            {isToday || !dayKey ? "Agenda de hoy" : formatDayLabel(dayKey)}
          </h2>
          <p className="mt-0.5 text-[13px] text-ops-text-muted">
            {isLoading ? "Cargando visitas" : [
              plural(visits.length, "visita"),
              ongoing ? `${ongoing} en curso` : null,
              waiting ? `${waiting} ${waiting === 1 ? "espera" : "esperan"} una acción` : null,
            ].filter(Boolean).join(" · ")}
          </p>
        </div>
        <Link
          className="inline-flex h-10 items-center gap-1.5 rounded-[10px] border border-ops-border px-3 text-[13px] font-semibold text-ops-text hover:bg-ops-surface-muted"
          href={dayKey ? `/dashboard/calendar?vista=agenda&dia=${dayKey}` : "/dashboard/calendar"}
        >
          Abrir en Visitas
          <ArrowRight className="size-[15px]" />
        </Link>
      </div>

      {todayKey ? (
        <div className="overflow-x-auto">
          <div className="grid min-w-[480px] grid-cols-7 gap-1.5">
            {getWeekDays(todayKey).map((day) => {
              const selected = day.dayKey === dayKey;
              const dayTotals = totals.get(day.dayKey);
              return (
                <button
                  aria-pressed={selected}
                  className={cn(
                    "flex min-w-0 flex-col items-start gap-0.5 rounded-[10px] border px-2.5 py-2 text-left transition-colors",
                    selected
                      ? "border-ops-bamboo-strong bg-ops-bamboo-strong text-white dark:text-ops-canvas"
                      : "border-ops-border bg-ops-surface hover:border-ops-bamboo/60"
                  )}
                  key={day.dayKey}
                  onClick={() => onPickDay(day.dayKey)}
                  type="button"
                >
                  <span className="flex items-baseline gap-1.5">
                    <span className={cn("text-[11.5px] font-semibold", selected ? "opacity-80" : "text-ops-text-muted")}>{day.shortWeekday}</span>
                    <span className={cn("text-base font-semibold tabular-nums", !selected && day.dayKey === todayKey && "text-ops-bamboo-strong")}>{day.day}</span>
                  </span>
                  <span className={cn("flex items-center gap-1.5 text-[11.5px] whitespace-nowrap", selected ? "opacity-80" : "text-ops-text-muted")}>
                    {dayTotals?.total ? plural(dayTotals.total, "visita") : "Sin visitas"}
                    {dayTotals?.attention ? <span className="size-1.5 shrink-0 rounded-full bg-amber-400" /> : null}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {error ? (
        <DashboardSectionError description="No mostramos una agenda vacía porque no pudimos confirmar las visitas." onRetry={onRetry} title="No pudimos cargar la agenda" />
      ) : isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((item) => <Skeleton className="h-16 w-full" key={item} />)}
        </div>
      ) : !visits.length ? (
        <OpsEmptyState description="Cuando haya visitas programadas este día aparecen acá." icon={CalendarDays} title="Sin visitas" />
      ) : (
        <ol className="flex flex-col gap-3.5">
          {groups.map((group, index) => (
            <GroupItem group={group} key={group.hour} nowLine={index === nowIndex ? nowMinute : null} onAction={onAction} states={states} />
          ))}
          {showNowAtEnd && nowMinute !== null ? <NowLine minute={nowMinute} /> : null}
        </ol>
      )}

      {isToday && !isLoading ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ops-surface-muted pt-3.5 text-[13px] text-ops-text-muted">
          <span>{tomorrowCount ? `Mañana: ${plural(tomorrowCount, "visita programada", "visitas programadas")}.` : "Mañana no hay visitas programadas."}</span>
        </div>
      ) : null}
    </section>
  );
};

const GroupItem = ({
  group,
  nowLine,
  onAction,
  states,
}: {
  group: VisitHourGroup<OpsOccurrence>;
  nowLine: number | null;
  onAction: (visit: OpsOccurrence, intent: DashboardVisitIntent) => void;
  states: Map<string, HomeVisitState>;
}) => (
  <>
    {nowLine !== null ? <NowLine minute={nowLine} /> : null}
    <li className="grid grid-cols-[52px_minmax(0,1fr)] gap-3">
      <div className="flex flex-col items-end pt-3">
        <span className="text-[13px] font-semibold text-ops-text tabular-nums">{group.label}</span>
        <span className="text-[11px] text-ops-text-muted">{plural(group.items.length, "visita")}</span>
      </div>
      <div className="flex min-w-0 flex-col gap-2 border-l-2 border-ops-surface-muted pl-3">
        {group.items.map((visit) => (
          <DashboardAgendaRow key={visit.id} onAction={onAction} state={states.get(visit.id) ?? "upcoming"} visit={visit} />
        ))}
      </div>
    </li>
  </>
);

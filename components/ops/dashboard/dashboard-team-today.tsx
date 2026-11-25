"use client";

import Link from "next/link";

import type { HomeWeekSummary } from "@/lib/ops/home-week";
import { formatHours } from "@/lib/ops/visit-day";
import { opsSurface } from "@/components/ops/shared";
import { VisitAvatar, VisitLoadBar } from "@/components/ops/visits/visit-bits";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Carga semanal de referencia, la misma barra que el Cronograma.
const WEEK_LOAD_HOURS = 30;

const listNames = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;

// Quien trabaja hoy, en que y cuanto lleva la semana.
export const DashboardTeamToday = ({
  employeeCount,
  isLoading,
  week,
}: {
  employeeCount: number;
  isLoading: boolean;
  week: HomeWeekSummary;
}) => {
  const free = week.freeToday.map((load) => load.name);

  return (
    <section aria-labelledby="equipo-titulo" className={cn(opsSurface.panel, "flex flex-col gap-3.5 p-4 md:p-5")}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-ops-text" id="equipo-titulo">Equipo hoy</h2>
        {isLoading ? null : (
          <span className="text-[12.5px] text-ops-text-muted">
            {week.today.length} de {employeeCount} trabajan hoy
          </span>
        )}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((item) => <Skeleton className="h-11 w-full" key={item} />)}
        </div>
      ) : week.today.length ? (
        <ul className="flex flex-col gap-3">
          {week.today.map((load) => (
            <li className="grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-2.5" key={load.id}>
              <VisitAvatar className="size-[34px] text-xs" name={load.name} />
              <div className="flex min-w-0 flex-col gap-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ops-text">{load.name}</span>
                  <span className="text-[11.5px] whitespace-nowrap text-ops-text-muted tabular-nums">
                    {formatHours(load.weekMinutes).replace(" h", "")} de {WEEK_LOAD_HOURS} h semanales
                  </span>
                </span>
                <VisitLoadBar max={WEEK_LOAD_HOURS} minutes={load.weekMinutes} />
                <span className="truncate text-xs text-ops-text-muted">{load.jobs.join(" · ")}</span>
              </div>
              <span className="text-[13px] font-semibold text-ops-text tabular-nums">{formatHours(load.todayMinutes)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ops-text-muted">Nadie tiene visitas asignadas hoy.</p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ops-surface-muted pt-3 text-[13px] text-ops-text-muted">
        <span>
          {isLoading || !free.length
            ? ""
            : free.length <= 3
              ? `Libres hoy: ${listNames(free)}.`
              : `Libres hoy: ${free.slice(0, 2).join(", ")} y ${free.length - 2} más.`}
        </span>
        <Link className="font-semibold text-ops-bamboo-strong underline-offset-[3px] hover:underline" href="/dashboard/employees">
          Ver equipo
        </Link>
      </div>
    </section>
  );
};

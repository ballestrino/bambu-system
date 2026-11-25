"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { ArrowLeftRight, ArrowRight, ShieldCheck, TrendingDown, TriangleAlert, UserPlus, UserRound } from "lucide-react";

import type { HomeWeekSummary } from "@/lib/ops/home-week";
import { getVisitTitle, plural } from "@/lib/ops/visit-day";
import { profitabilityNeedsAttention } from "@/components/ops/profitability/profitability-status";
import { opsAttention, opsSurface, opsToneClasses, type OpsTone } from "@/components/ops/shared";
import { Skeleton } from "@/components/ui/skeleton";
import type { JobProfitability } from "@/lib/ops/profitability";
import { cn } from "@/lib/utils";

type AttentionItem = {
  detail: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  id: string;
  title: string;
  tone: OpsTone;
};

const listNames = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;

const buildItems = (week: HomeWeekSummary, profitability: JobProfitability[]): AttentionItem[] => {
  const items: AttentionItem[] = [];
  const unassigned = week.unassigned.length;
  if (unassigned) {
    const today = [...new Set(week.unassignedToday.map(getVisitTitle))];
    items.push({
      detail: today.length ? `${today.length === 1 ? "Una es" : `${today.length} son`} de hoy: ${listNames(today.slice(0, 3))}.` : "Ninguna es de hoy.",
      href: "/dashboard/calendar?vista=cron",
      icon: UserPlus,
      id: "sin-asignar",
      title: `${plural(unassigned, "visita", "visitas")} sin asignar esta semana`,
      tone: "warning",
    });
  }
  if (week.overlaps) {
    items.push({
      detail: "Una empleada tiene dos visitas a la vez. Revisalos en el Cronograma.",
      href: "/dashboard/calendar?vista=cron",
      icon: ArrowLeftRight,
      id: "cruces",
      title: plural(week.overlaps, "cruce de horario", "cruces de horario"),
      tone: "warning",
    });
  }
  const atRisk = profitability.filter((result) => profitabilityNeedsAttention(result.severity)).length;
  if (atRisk) {
    items.push({
      detail: "Revisá horas, boletos y costes antes del cierre.",
      href: "/dashboard/financial?seccion=rentabilidad",
      icon: TrendingDown,
      id: "rentabilidad",
      title: `${plural(atRisk, "servicio", "servicios")} con rentabilidad en riesgo`,
      tone: "danger",
    });
  }
  if (week.idle.length) {
    const names = week.idle.map((load) => load.name);
    items.push({
      detail: unassigned ? "Pueden cubrir las sin asignar." : "No tienen horas cargadas en el cronograma.",
      href: "/dashboard/employees",
      icon: UserRound,
      id: "sin-visitas",
      title: names.length === 1 ? `${names[0]} no tiene visitas esta semana` : `${names.length} empleadas sin visitas esta semana`,
      tone: "neutral",
    });
  }
  return items;
};

// "Requiere atención" de Inicio: lo de esta semana. Las pendientes de registro
// no van aca, tienen su aviso y su vista.
export const DashboardAttentionPanel = ({
  isLoading,
  profitability,
  profitabilityError,
  week,
}: {
  isLoading: boolean;
  profitability: JobProfitability[];
  profitabilityError: unknown;
  week: HomeWeekSummary;
}) => {
  const items = isLoading ? [] : buildItems(week, profitability);

  return (
    <section aria-labelledby="atencion-titulo" className={cn(opsSurface.panel, "flex flex-col gap-3 p-4 md:p-5")}>
      <div className="flex items-center gap-2">
        <TriangleAlert className="size-4 text-ops-amber" />
        <h2 className="flex-1 text-base font-semibold text-ops-text" id="atencion-titulo">Requiere atención</h2>
        {items.length ? (
          <span className={cn("flex h-[22px] min-w-[22px] items-center justify-center rounded-full border px-[7px] text-xs font-semibold", opsAttention.chip)}>
            {items.length}
          </span>
        ) : null}
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : items.length ? (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <Link className={cn(opsSurface.panelSoft, "flex items-start gap-3 p-3 transition-colors hover:bg-ops-surface")} href={item.href} key={item.id}>
              <span className={cn("mt-0.5 shrink-0 rounded-[var(--ops-radius-control)] border p-1.5", opsToneClasses[item.tone])}>
                <item.icon className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ops-text">{item.title}</span>
                <span className="block text-[12.5px] text-ops-text-muted">{item.detail}</span>
              </span>
              <ArrowRight className="mt-1 size-4 shrink-0 text-ops-text-muted" />
            </Link>
          ))}
        </div>
      ) : (
        <div className={cn("flex items-center gap-3 rounded-[var(--ops-radius-row)] border p-3.5 text-sm", opsToneClasses.success)}>
          <ShieldCheck className="size-5 shrink-0" />
          Nada urgente esta semana: todo asignado y sin cruces.
        </div>
      )}
      {profitabilityError ? (
        <p className="text-xs text-ops-text-muted">No pudimos revisar la rentabilidad del mes.</p>
      ) : null}
    </section>
  );
};

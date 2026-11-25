"use client";

import Link from "next/link";
import { useId } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, ChevronDown, ClipboardCheck } from "lucide-react";

import {
  formatDayMonth,
  getPendingAlertTone,
  PENDING_AGES,
  type PendingAge,
} from "@/lib/ops/pending-visits";
import { shiftDayKey } from "@/lib/ops/visit-calendar";
import { getVisitTitle, plural } from "@/lib/ops/visit-day";
import { DashboardSectionError } from "@/components/ops/dashboard/dashboard-section-error";
import type { PendingVisitsData } from "@/components/ops/hooks/usePendingVisits";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const PENDING_VIEW_HREF = "/dashboard/calendar?vista=pendientes";

const primaryLink =
  "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] bg-ops-bamboo-strong px-[18px] text-sm font-semibold text-white hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas";

// De la mas nueva a la mas vieja, cada vez mas oscura.
const AGE_STYLES: Record<PendingAge, { dot: string; label: string }> = {
  month: { dot: "bg-[#b7791f]", label: "de 8 a 30 días" },
  old: { dot: "bg-[#6f420e] dark:bg-[#c9852a]", label: "de más de 30 días" },
  today: { dot: "bg-[#f3cd5d]", label: "de hoy" },
  week: { dot: "bg-[#e0a32e]", label: "de los últimos 7 días" },
};

const listNames = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;

type PendingReview = { controls: string; expanded: boolean; onToggle: () => void };

const ReviewAction = ({ className, label, review }: { className?: string; label: string; review?: PendingReview }) => (
  review ? (
    <button
      aria-controls={review.controls}
      aria-expanded={review.expanded}
      className={cn(primaryLink, "max-sm:w-full")}
      onClick={review.onToggle}
      type="button"
    >
      {review.expanded ? "Ocultar pendientes" : label}
      <ChevronDown className={cn("size-4", review.expanded && "rotate-180")} />
    </button>
  ) : (
    <Link className={cn(primaryLink, className)} href={PENDING_VIEW_HREF}>
      {label}
      <ArrowRight className="size-4" />
    </Link>
  )
);

export const DashboardPendingAlert = ({ pending, review }: {
  pending: PendingVisitsData;
  review?: PendingReview;
}) => {
  const headingId = useId();
  const { summary } = pending;

  if (pending.error && !pending.hasData) {
    return (
      <DashboardSectionError
        description="No mostramos cero porque la consulta falló."
        onRetry={pending.refetch}
        title="No pudimos contar las visitas pendientes"
      />
    );
  }
  if (pending.isLoading) return <Skeleton className="h-[132px] w-full rounded-[var(--ops-radius-panel)]" />;

  const tone = getPendingAlertTone(summary);

  if (tone === "clear") {
    const tomorrow = pending.tomorrow.length;
    return (
      <section className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-[var(--ops-radius-panel)] border border-emerald-300 bg-emerald-50 px-[18px] py-2 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200">
        <CheckCircle2 className="size-[18px] shrink-0" />
        <p className="flex-1 text-sm">
          <strong>Todo registrado.</strong>{" "}
          {tomorrow ? `Mañana hay ${plural(tomorrow, "visita programada", "visitas programadas")}.` : "Mañana no hay visitas programadas."}
        </p>
        {!review && tomorrow && pending.todayKey ? (
          <Link className="inline-flex h-10 items-center text-[13px] font-semibold underline-offset-[3px] hover:underline" href={`/dashboard/calendar?vista=agenda&dia=${shiftDayKey(pending.todayKey, 1)}`}>
            Ver mañana
          </Link>
        ) : null}
      </section>
    );
  }

  if (tone === "today") {
    const names = [...new Set(pending.visits.map(getVisitTitle))];
    return (
      <section aria-labelledby={headingId} className="flex flex-wrap items-center gap-x-6 gap-y-3.5 rounded-[var(--ops-radius-panel)] border border-ops-bamboo/35 bg-ops-bamboo-soft px-5 py-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] border border-ops-bamboo/35 bg-ops-surface text-ops-bamboo-strong">
          <ClipboardCheck className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-[1_1_320px]">
          <h2 className="text-base font-semibold text-ops-text" id={headingId}>
            {summary.total === 1 ? "1 visita de hoy espera registro" : `${summary.total} visitas de hoy esperan registro`}
          </h2>
          <p className="mt-0.5 text-[13.5px] text-ops-text-muted">
            {!review && `${listNames(names.slice(0, 3))}${names.length > 3 ? ` y ${plural(names.length - 3, "trabajo")} más` : ""}. `}
            Lo de días anteriores está al día.
          </p>
        </div>
        <ReviewAction label={review ? "Revisar pendientes" : "Registrar"} review={review} />
      </section>
    );
  }

  const details = [
    summary.ages.old ? `${summary.ages.old} ${summary.ages.old === 1 ? "tiene" : "tienen"} más de 30 días` : null,
    summary.unassigned ? `${summary.unassigned} no ${summary.unassigned === 1 ? "tiene" : "tienen"} equipo` : null,
  ].filter(Boolean);

  return (
    <section aria-labelledby={headingId} className="flex flex-wrap items-center gap-x-7 gap-y-4 rounded-[var(--ops-radius-panel)] border border-amber-300 bg-amber-50 px-5 py-[18px] dark:border-amber-500/40 dark:bg-amber-500/10">
      <div className="flex min-w-0 flex-[1_1_480px] gap-3.5">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-300 bg-amber-100 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200">
          <CalendarClock className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div>
            <h2 className="text-[17px] font-semibold tracking-tight text-ops-text" id={headingId}>
              {plural(summary.total, "visita pendiente", "visitas pendientes")} de registrar
            </h2>
            <p className="mt-0.5 text-[13.5px] leading-snug text-amber-900/80 dark:text-amber-100/80">
              {summary.oldestDayKey ? `La más vieja es del ${formatDayMonth(summary.oldestDayKey)}. ` : ""}
              {details.length ? `${listNames(details as string[])}.` : ""}
            </p>
          </div>
          <div aria-hidden className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            {PENDING_AGES.map((age) =>
              summary.ages[age] ? (
                <span className={AGE_STYLES[age].dot} key={age} style={{ width: `${(summary.ages[age] / summary.total) * 100}%` }} />
              ) : null
            )}
          </div>
          <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-amber-900/80 dark:text-amber-100/80">
            {PENDING_AGES.map((age) => (
              <li className="inline-flex items-center gap-1.5" key={age}>
                <span className={cn("size-2 rounded-full", AGE_STYLES[age].dot)} />
                <b className="font-semibold text-ops-text tabular-nums">{summary.ages[age]}</b>
                {AGE_STYLES[age].label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <ReviewAction className="max-sm:w-full" label="Revisar pendientes" review={review} />
    </section>
  );
};

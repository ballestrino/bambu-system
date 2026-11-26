"use client";

import { ChevronRight } from "lucide-react";

import { RulesToolbar } from "@/components/ops/schedule-rules/rules-toolbar";
import {
  clock,
  DAY_LETTERS,
  isEndedRule,
  monthlyRules,
  ruleRangeLabel,
  rulesOnWeekday,
} from "@/components/ops/schedule-rules/schedule-rules-model";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { cn } from "@/lib/utils";

type Row = ScheduleRulesController["rows"][number];

// Semana en chiquito de una tarjeta: la hora de entrada por día, "2 hor." si
// hay más de un horario, ámbar si se cruzan y punteada si venció.
const MiniWeek = ({ row, todayKey }: { row: Row; todayKey: string }) => (
  <span className="grid w-full grid-cols-7 gap-1">
    {DAY_LETTERS.map((letter, index) => {
      const rules = rulesOnWeekday(row.job, index + 1);
      const live = rules.filter((rule) => !isEndedRule(rule, todayKey));
      const crossed = live.some((rule) => row.warnings.flagged.has(rule.id));
      const text = !rules.length ? "" : !live.length ? "—" : live.length > 1 ? `${live.length} hor.` : clock(live[0].startTimeMinutes).replace(":00", " h");
      return (
        <span className="flex flex-col items-center gap-0.5" key={letter}>
          <span className="text-[11px] font-semibold text-ops-text-muted">{letter}</span>
          <span
            className={cn(
              "flex h-[26px] w-full items-center justify-center rounded-md border text-[11px] font-semibold",
              !rules.length && "border-transparent bg-ops-surface-muted",
              rules.length && !live.length && "border-dashed border-ops-text-muted/50 text-ops-text-muted",
              live.length && crossed && "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200",
              live.length && !crossed && "border-ops-bamboo/30 bg-ops-bamboo-soft text-ops-bamboo-strong"
            )}
          >
            {text}
          </span>
        </span>
      );
    })}
  </span>
);

export const RulesPhoneList = ({ ctrl, onOpen }: { ctrl: ScheduleRulesController; onOpen: (jobId: string) => void }) => (
  <div className="flex flex-col gap-3.5 pt-2">
    <div className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-ops-bamboo-strong">Operaciones › Trabajos</span>
      <h1 className="text-[26px] leading-tight font-bold tracking-tight text-ops-text">Reglas de calendario</h1>
      <p className="text-sm text-ops-text-muted">La semana tipo de cada servicio.</p>
    </div>
    <RulesToolbar compact ctrl={ctrl} />
    {ctrl.rows.map((row) => {
      const monthly = monthlyRules(row.job);
      return (
        <button
          className="flex w-full flex-col gap-2.5 rounded-[14px] border border-ops-border bg-ops-surface p-3.5 text-left"
          key={row.job.id}
          onClick={() => onOpen(row.job.id)}
          type="button"
        >
          <span className="flex w-full items-start justify-between gap-2">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-base font-semibold text-ops-text">{row.job.name}</span>
              {row.job.serviceAddress ? <span className="line-clamp-1 text-[13px] text-ops-text-muted">{row.job.serviceAddress}</span> : null}
            </span>
            <ChevronRight className="mt-0.5 size-[18px] shrink-0 text-ops-text-muted" />
          </span>
          <MiniWeek row={row} todayKey={ctrl.todayKey} />
          {monthly.length ? (
            <span className="text-[13px] text-ops-text">
              {monthly.map((rule) => `Mensual: día ${rule.dayOfMonth} · ${ruleRangeLabel(rule)}`).join(" · ")}
            </span>
          ) : null}
          {row.warnings.list.map((warning) => (
            <span
              className="self-start rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
              key={`${warning.ruleId}-${warning.text}`}
            >
              {warning.text}
            </span>
          ))}
        </button>
      );
    })}
    {!ctrl.rows.length ? (
      <p className="px-1 py-6 text-sm text-ops-text-muted">
        {ctrl.board.isLoading ? "Cargando servicios…" : "Ningún servicio coincide con el filtro o la búsqueda."}
      </p>
    ) : null}
  </div>
);

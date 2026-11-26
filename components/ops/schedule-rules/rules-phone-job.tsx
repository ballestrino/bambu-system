"use client";

import { ChevronLeft, Plus } from "lucide-react";

import {
  DAY_NAMES,
  isEndedRule,
  monthlyRules,
  ruleDaysLabel,
  ruleRangeLabel,
  rulesOnWeekday,
  ruleTimeLabel,
  type BoardRule,
} from "@/components/ops/schedule-rules/schedule-rules-model";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { cn } from "@/lib/utils";

type Selected = NonNullable<ScheduleRulesController["selected"]>;

// Semana de un servicio en el celular: una fila por día y una mensual, con sus
// horarios y un "+" para agregar.
export const RulesPhoneJob = ({
  ctrl,
  onBack,
  onNew,
  onRule,
  selected,
}: {
  ctrl: ScheduleRulesController;
  onBack: () => void;
  onNew: (frequency: "WEEKLY" | "MONTHLY", weekday: number | null) => void;
  onRule: (ruleId: string) => void;
  selected: Selected;
}) => {
  const { job, warnings } = selected;
  const chip = (rule: BoardRule) => {
    const ended = isEndedRule(rule, ctrl.todayKey);
    const crossed = warnings.flagged.has(rule.id);
    return (
      <button
        aria-label={`Horario ${ruleDaysLabel(rule)}, ${ruleTimeLabel(rule)}${ended ? ", vencido" : ""}`}
        className={cn(
          "min-h-11 rounded-[10px] border-[1.5px] px-3 text-sm font-semibold whitespace-nowrap",
          ended
            ? "border-dashed border-ops-text-muted/50 text-ops-text-muted line-through"
            : crossed
              ? "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
              : "border-ops-bamboo/30 bg-ops-bamboo-soft text-ops-bamboo-strong"
        )}
        key={rule.id}
        onClick={() => onRule(rule.id)}
        type="button"
      >
        {rule.frequency === "MONTHLY" ? `Día ${rule.dayOfMonth} · ${ruleRangeLabel(rule)}` : ruleRangeLabel(rule)}
      </button>
    );
  };
  const rows = [
    ...DAY_NAMES.map((name, index) => ({ add: () => onNew("WEEKLY", index + 1), name, rules: rulesOnWeekday(job, index + 1) })),
    { add: () => onNew("MONTHLY", null), name: "Mensual", rules: monthlyRules(job) },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <button className="inline-flex min-h-11 items-center gap-1 self-start text-[15px] font-semibold text-ops-bamboo-strong" onClick={onBack} type="button">
        <ChevronLeft className="size-4" />
        Servicios
      </button>
      <div className="-mt-1.5 flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-ops-text">{job.name}</h1>
        {job.serviceAddress ? <p className="text-sm text-ops-text-muted">{job.serviceAddress}</p> : null}
      </div>
      {warnings.list
        .filter((warning) => warning.ruleId)
        .map((warning) => (
          <button
            className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 text-left text-sm font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200"
            key={`${warning.ruleId}-${warning.text}`}
            onClick={() => onRule(warning.ruleId ?? "")}
            type="button"
          >
            {warning.text}
            <span className="font-semibold whitespace-nowrap">Revisar ›</span>
          </button>
        ))}
      <div className="overflow-hidden rounded-[14px] border border-ops-border bg-ops-surface">
        {rows.map((row) => (
          <div className="flex min-h-[60px] items-center gap-2.5 border-b border-ops-border/60 py-2 pr-2 pl-3.5 last:border-b-0" key={row.name}>
            <span className={cn("w-[78px] flex-none text-sm font-semibold", row.rules.length ? "text-ops-text" : "text-ops-text-muted")}>{row.name}</span>
            <span className="flex min-w-0 flex-1 flex-wrap gap-1.5">
              {row.rules.map(chip)}
              {!row.rules.length ? <span className="text-sm text-ops-text-muted">Libre</span> : null}
            </span>
            <button
              aria-label={row.name === "Mensual" ? "Agregar horario mensual" : `Agregar horario el ${row.name.toLowerCase()}`}
              className="flex size-11 flex-none items-center justify-center rounded-xl border border-dashed border-ops-bamboo/40 text-ops-bamboo-strong"
              onClick={row.add}
              type="button"
            >
              <Plus className="size-5" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-[13px] text-ops-text-muted">Un horario se toca para cambiarlo o limpiar sus visitas.</p>
    </div>
  );
};

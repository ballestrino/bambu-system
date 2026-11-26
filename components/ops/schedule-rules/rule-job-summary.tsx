"use client";

import { ChevronRight, Plus } from "lucide-react";

import { jobsPrimaryButtonClass } from "@/components/ops/jobs/jobs-styles";
import {
  isEndedRule,
  ruleDaysLabel,
  ruleTimeLabel,
  ruleValidityLabel,
} from "@/components/ops/schedule-rules/schedule-rules-model";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Selected = NonNullable<ScheduleRulesController["selected"]>;

// Panel de un trabajo: avisos que llevan al horario con problema, sus horarios
// y "Agregar horario".
export const RuleJobSummary = ({ ctrl, selected }: { ctrl: ScheduleRulesController; selected: Selected }) => {
  const { job, warnings } = selected;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-ops-text">{job.name}</h2>
        {job.serviceAddress ? <p className="text-sm text-ops-text-muted">{job.serviceAddress}</p> : null}
      </div>
      {warnings.list
        .filter((warning) => warning.ruleId)
        .map((warning) => (
          <button
            className="flex min-h-11 items-center justify-between gap-2 rounded-[10px] border border-amber-300 bg-amber-50 px-3 py-2 text-left text-sm font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200"
            key={`${warning.ruleId}-${warning.text}`}
            onClick={() => ctrl.openRule(job.id, warning.ruleId ?? "")}
            type="button"
          >
            {warning.text}
            <span className="font-semibold whitespace-nowrap">Revisar</span>
          </button>
        ))}
      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-semibold tracking-wide text-ops-text-muted uppercase">Horarios</h3>
        {job.rules.map((rule) => {
          const ended = isEndedRule(rule, ctrl.todayKey);
          const crossed = warnings.flagged.has(rule.id);
          return (
            <button
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors hover:border-ops-bamboo/50",
                crossed ? "border-amber-300 bg-amber-50/60 dark:border-amber-500/40 dark:bg-amber-500/10" : "border-ops-border bg-ops-surface"
              )}
              key={rule.id}
              onClick={() => ctrl.openRule(job.id, rule.id)}
              type="button"
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-semibold text-ops-text">{ruleDaysLabel(rule)}</span>
                  {ended || crossed ? (
                    <span className={cn("text-xs font-semibold", ended ? "text-ops-text-muted" : "text-amber-800 dark:text-amber-200")}>
                      {ended ? "Vencido" : "Se cruza"}
                    </span>
                  ) : null}
                </span>
                <span className="text-sm text-ops-text">{ruleTimeLabel(rule)}</span>
                <span className="text-[13px] text-ops-text-muted">{ruleValidityLabel(rule)}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-ops-text-muted" />
            </button>
          );
        })}
        {!job.rules.length ? (
          <p className="rounded-xl bg-ops-surface-muted p-4 text-sm text-ops-text-muted">
            Este servicio todavía no tiene horario. Se le da uno tocando un día de su fila o con el botón de abajo.
          </p>
        ) : null}
      </div>
      <Button className={jobsPrimaryButtonClass} onClick={() => ctrl.openNew(job.id, "WEEKLY", 1)}>
        <Plus className="size-4" />
        Agregar horario
      </Button>
    </div>
  );
};

"use client";

import { Plus } from "lucide-react";

import { RuleChip } from "@/components/ops/schedule-rules/rule-chip";
import {
  DAY_NAMES,
  DAY_SHORT,
  monthlyRules,
  plural,
  rulesOnWeekday,
  type BoardRule,
} from "@/components/ops/schedule-rules/schedule-rules-model";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { cn } from "@/lib/utils";

const gridClass = "grid grid-cols-[216px_repeat(7,minmax(86px,1fr))_96px]";

const AddButton = ({ filled, label, onClick }: { filled: boolean; label: string; onClick: () => void }) => (
  <button
    aria-label={label}
    className={cn(
      "flex grow items-center justify-center rounded-lg text-ops-bamboo transition-colors hover:bg-ops-bamboo-soft",
      filled ? "min-h-[26px]" : "min-h-[58px] border border-dashed border-ops-border"
    )}
    onClick={onClick}
    type="button"
  >
    <Plus className="size-4" />
  </button>
);

// Semana tipo de todos los trabajos: una fila por trabajo, una columna por día
// y una para los horarios mensuales.
export const RulesMatrix = ({ ctrl }: { ctrl: ScheduleRulesController }) => {
  const { mode, rows, selected, todayKey } = ctrl;
  const selectedRuleId = mode === "rule" ? ctrl.rule?.id : null;

  const cell = (jobId: string, jobName: string, flagged: Set<string>, rules: BoardRule[], add: () => void, label: string) => (
    <div className="flex min-h-[72px] flex-col gap-1 border-l border-ops-border/60 p-1.5">
      {rules.map((rule) => (
        <RuleChip
          flagged={flagged.has(rule.id)}
          jobName={jobName}
          key={rule.id}
          onOpen={() => ctrl.openRule(jobId, rule.id)}
          rule={rule}
          selected={rule.id === selectedRuleId}
          todayKey={todayKey}
        />
      ))}
      <AddButton filled={rules.length > 0} label={label} onClick={add} />
    </div>
  );

  return (
    <section aria-label="Semana tipo por servicio" className="min-w-0 overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
      <div className="overflow-x-auto">
        <div className="min-w-[920px]">
          <div className={cn(gridClass, "border-b border-ops-border bg-ops-surface-muted")}>
            <div className="px-4 py-3 text-xs font-semibold tracking-wide text-ops-text-muted uppercase">Servicio</div>
            {DAY_SHORT.map((label, index) => (
              <div className="flex flex-col gap-0.5 border-l border-ops-border px-2 py-2.5" key={label}>
                <span className="text-[13px] font-semibold text-ops-text">{label}</span>
                <span className="text-xs text-ops-text-muted">{plural(ctrl.dayCounts[index], "servicio", "servicios")}</span>
              </div>
            ))}
            <div className="flex flex-col gap-0.5 border-l border-ops-border px-2 py-2.5">
              <span className="text-[13px] font-semibold text-ops-text">Mensual</span>
              <span className="text-xs text-ops-text-muted">día fijo</span>
            </div>
          </div>
          {rows.map(({ job, warnings }) => {
            const isSelected = job.id === selected?.job.id;
            return (
              <div className={cn(gridClass, "border-b border-ops-border/70", isSelected ? "bg-ops-bamboo-soft/60" : "bg-ops-surface")} key={job.id}>
                <button
                  aria-pressed={isSelected}
                  className={cn(
                    "flex flex-col gap-1 border-l-4 p-3 text-left",
                    isSelected ? "border-l-ops-bamboo" : "border-l-transparent hover:bg-ops-surface-muted"
                  )}
                  onClick={() => ctrl.selectJob(job.id)}
                  type="button"
                >
                  <span className="text-sm leading-tight font-semibold text-ops-text">{job.name}</span>
                  {job.serviceAddress ? <span className="line-clamp-1 text-xs text-ops-text-muted">{job.serviceAddress}</span> : null}
                  {job.status === "PAUSED" ? <span className="text-xs font-medium text-ops-text-muted">Pausado</span> : null}
                  {warnings.list.map((warning) => (
                    <span
                      className="mt-0.5 self-start rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-500/15 dark:text-amber-200"
                      key={`${warning.ruleId}-${warning.text}`}
                    >
                      {warning.text}
                    </span>
                  ))}
                </button>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div className="contents" key={day}>
                    {cell(job.id, job.name, warnings.flagged, rulesOnWeekday(job, day), () => ctrl.openNew(job.id, "WEEKLY", day), `Agregar horario a ${job.name} el ${DAY_NAMES[day - 1].toLowerCase()}`)}
                  </div>
                ))}
                {cell(job.id, job.name, warnings.flagged, monthlyRules(job), () => ctrl.openNew(job.id, "MONTHLY", null), `Agregar horario mensual a ${job.name}`)}
              </div>
            );
          })}
          {!rows.length ? (
            <p className="px-4 py-8 text-sm text-ops-text-muted">
              {ctrl.board.isLoading ? "Cargando servicios…" : "Ningún servicio coincide con el filtro o la búsqueda."}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};

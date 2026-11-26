"use client";

import { ChevronLeft, LoaderCircle } from "lucide-react";

import { jobsOutlineButtonClass, jobsPrimaryButtonClass } from "@/components/ops/jobs/jobs-styles";
import { RuleCleanupBody, RuleCleanupButton } from "@/components/ops/schedule-rules/rule-cleanup-panel";
import { RuleFormFields } from "@/components/ops/schedule-rules/rule-form-fields";
import { ruleDaysLabel, ruleTimeLabel, type BoardRule } from "@/components/ops/schedule-rules/schedule-rules-model";
import { useRuleCleanup } from "@/components/ops/schedule-rules/use-rule-cleanup";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { Button } from "@/components/ui/button";

const RuleCleanupSection = ({ ctrl, rule }: { ctrl: ScheduleRulesController; rule: BoardRule }) => {
  const cleanup = useRuleCleanup(ctrl, rule);
  return (
    <div className="flex flex-col gap-3.5 p-5">
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-bold text-ops-text">Limpiar visitas de este horario</h3>
        <p className="text-sm text-ops-text-muted">Para borrar las que se generaron mal, hacia atrás o hacia adelante.</p>
      </div>
      <RuleCleanupBody cleanup={cleanup} />
      <RuleCleanupButton cleanup={cleanup} />
      <button
        className="min-h-9 self-start text-sm font-semibold text-red-700 underline disabled:opacity-45 dark:text-red-300"
        disabled={ctrl.mutations.isRemoving}
        onClick={() => void ctrl.removeRule()}
        type="button"
      >
        Eliminar el horario y sus visitas desde hoy
      </button>
    </div>
  );
};

// Panel del escritorio para crear o editar un horario. Al editar suma la
// limpieza de visitas.
export const RuleEditor = ({ ctrl }: { ctrl: ScheduleRulesController }) => {
  const { form, mode, rule, selected } = ctrl;
  if (!selected) return null;
  const isRule = mode === "rule" && rule;

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-ops-border p-5">
        <div className="flex flex-col gap-1">
          <button
            className="inline-flex min-h-8 items-center gap-1 self-start text-sm font-semibold text-ops-bamboo-strong"
            onClick={() => ctrl.selectJob(selected.job.id)}
            type="button"
          >
            <ChevronLeft className="size-4" />
            {selected.job.name}
          </button>
          <h2 className="text-xl font-bold text-ops-text">{isRule ? ruleDaysLabel(rule) : "Nuevo horario"}</h2>
          <p className="text-sm text-ops-text-muted">{isRule ? ruleTimeLabel(rule) : `Para ${selected.job.name}`}</p>
        </div>
        <RuleFormFields error={ctrl.formError} form={form} mode={isRule ? "rule" : "new"} onChange={ctrl.setForm} todayKey={ctrl.todayKey} />
        <div className="flex gap-2.5">
          <Button className={`${jobsPrimaryButtonClass} flex-1`} disabled={Boolean(ctrl.formError) || ctrl.mutations.isSaving} onClick={() => void ctrl.save()}>
            {ctrl.mutations.isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isRule ? "Guardar cambios" : "Guardar horario"}
          </Button>
          <Button className={jobsOutlineButtonClass} onClick={() => ctrl.selectJob(selected.job.id)} variant="outline">
            Cancelar
          </Button>
        </div>
      </div>
      {isRule ? <RuleCleanupSection ctrl={ctrl} key={rule.id} rule={rule} /> : null}
    </>
  );
};

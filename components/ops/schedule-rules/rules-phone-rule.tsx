"use client";

import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";

import { classifyRuleVisit } from "@/lib/ops/schedule-rule-cleanup-window";
import { RuleCleanupBody, RuleCleanupButton } from "@/components/ops/schedule-rules/rule-cleanup-panel";
import { RuleFormFields } from "@/components/ops/schedule-rules/rule-form-fields";
import {
  ruleDaysLabel,
  ruleTimeLabel,
  ruleValidityLabel,
  type BoardRule,
} from "@/components/ops/schedule-rules/schedule-rules-model";
import { useRuleCleanup } from "@/components/ops/schedule-rules/use-rule-cleanup";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { useRuleVisits } from "@/components/ops/schedule-rules/use-schedule-rules-queries";

const BackLink = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <button className="inline-flex min-h-11 items-center gap-1 self-start text-[15px] font-semibold text-ops-bamboo-strong" onClick={onClick} type="button">
    <ChevronLeft className="size-4" />
    {label}
  </button>
);

const footerClass = "sticky bottom-0 -mx-4 mt-2 border-t border-ops-border bg-ops-surface px-4 pt-3 pb-4";

// Pantalla de un horario en el celular: cuántas visitas tiene, el acceso a
// limpiarlas, el formulario y "Guardar cambios" fijo abajo.
export const RulesPhoneRule = ({
  ctrl,
  onBack,
  onCleanup,
  rule,
}: {
  ctrl: ScheduleRulesController;
  onBack: () => void;
  onCleanup: () => void;
  rule: BoardRule;
}) => {
  const { visits } = useRuleVisits(rule.id);
  const states = visits.map((visit) => classifyRuleVisit(visit, ctrl.todayKey));
  const stats = [
    { label: "realizadas", value: states.filter((state) => state === "done").length },
    { label: "pendientes", value: states.filter((state) => state === "pending").length },
    { label: "programadas", value: states.filter((state) => state === "future").length },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      <BackLink label={ctrl.selected?.job.name ?? "Servicio"} onClick={onBack} />
      <div className="-mt-1.5 flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-ops-text">{ruleDaysLabel(rule)}</h1>
        <p className="text-[15px] text-ops-text">{ruleTimeLabel(rule)}</p>
        <p className="text-[13px] text-ops-text-muted">{ruleValidityLabel(rule)}</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stats.map((stat) => (
          <div className="flex flex-col gap-0.5 rounded-xl border border-ops-border bg-ops-surface p-2.5" key={stat.label}>
            <span className="text-xl font-bold text-ops-text">{stat.value}</span>
            <span className="text-xs text-ops-text-muted">{stat.label}</span>
          </div>
        ))}
      </div>
      <button className="flex min-h-14 items-center justify-between gap-2 rounded-xl border border-ops-border bg-ops-surface px-3.5 text-left" onClick={onCleanup} type="button">
        <span className="flex flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-ops-text">Limpiar visitas</span>
          <span className="text-[13px] text-ops-text-muted">Borrar hacia atrás o hacia adelante</span>
        </span>
        <ChevronRight className="size-[18px] text-ops-text-muted" />
      </button>
      <h2 className="mt-1.5 text-xs font-semibold tracking-wide text-ops-text-muted uppercase">Editar</h2>
      <div className="rounded-[14px] border border-ops-border bg-ops-surface p-3.5">
        <RuleFormFields error={ctrl.formError} form={ctrl.form} mode="rule" onChange={ctrl.setForm} todayKey={ctrl.todayKey} />
      </div>
      <button
        className="min-h-11 self-start text-sm font-semibold text-red-700 underline disabled:opacity-45 dark:text-red-300"
        disabled={ctrl.mutations.isRemoving}
        onClick={() => void ctrl.removeRule().then(onBack)}
        type="button"
      >
        Eliminar el horario y sus visitas desde hoy
      </button>
      <div className={footerClass}>
        <button
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-ops-bamboo-strong text-[15px] font-semibold text-white disabled:opacity-45 dark:text-ops-canvas"
          disabled={Boolean(ctrl.formError) || ctrl.mutations.isSaving}
          onClick={() => void ctrl.save()}
          type="button"
        >
          {ctrl.mutations.isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Guardar cambios
        </button>
      </div>
    </div>
  );
};

export const RulesPhoneCleanup = ({ ctrl, onBack, rule }: { ctrl: ScheduleRulesController; onBack: () => void; rule: BoardRule }) => {
  const cleanup = useRuleCleanup(ctrl, rule);
  return (
    <div className="flex flex-col gap-3.5">
      <BackLink label="Horario" onClick={onBack} />
      <div className="-mt-1.5 flex flex-col gap-0.5">
        <h1 className="text-2xl font-bold text-ops-text">Limpiar visitas</h1>
        <p className="text-sm text-ops-text-muted">
          {ctrl.selected?.job.name} · {ruleDaysLabel(rule)} · {ruleTimeLabel(rule)}
        </p>
      </div>
      <RuleCleanupBody cleanup={cleanup} />
      <div className={footerClass}>
        <RuleCleanupButton className="min-h-12 rounded-xl text-[15px]" cleanup={cleanup} />
      </div>
    </div>
  );
};

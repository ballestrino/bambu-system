"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";

import { RuleFormFields } from "@/components/ops/schedule-rules/rule-form-fields";
import { RulesPhoneJob } from "@/components/ops/schedule-rules/rules-phone-job";
import { RulesPhoneList } from "@/components/ops/schedule-rules/rules-phone-list";
import { RulesPhoneCleanup, RulesPhoneRule } from "@/components/ops/schedule-rules/rules-phone-rule";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

type Screen = "list" | "job" | "rule" | "cleanup";

// Celular (diseño Celular-*): lista de servicios, semana del servicio, horario
// y limpiar visitas, con la hoja de nuevo horario sobre la semana.
export const RulesPhone = ({ ctrl, enabled }: { ctrl: ScheduleRulesController; enabled: boolean }) => {
  const [screen, setScreen] = useState<Screen>("list");
  const [sheetOpen, setSheetOpen] = useState(false);
  const { rule, selected } = ctrl;
  const current: Screen = !selected ? "list" : (screen === "rule" || screen === "cleanup") && !rule ? "job" : screen;

  const goTo = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0 });
  };

  const saveNew = async () => {
    if (await ctrl.save()) setSheetOpen(false);
  };

  return (
    <div className="flex flex-col pb-4">
      {current === "list" ? (
        <RulesPhoneList ctrl={ctrl} onOpen={(jobId) => { ctrl.selectJob(jobId); goTo("job"); }} />
      ) : null}
      {current === "job" && selected ? (
        <RulesPhoneJob
          ctrl={ctrl}
          onBack={() => goTo("list")}
          onNew={(frequency, weekday) => {
            ctrl.openNew(selected.job.id, frequency, weekday);
            setSheetOpen(true);
          }}
          onRule={(ruleId) => { ctrl.openRule(selected.job.id, ruleId); goTo("rule"); }}
          selected={selected}
        />
      ) : null}
      {current === "rule" && rule ? (
        <RulesPhoneRule ctrl={ctrl} onBack={() => goTo("job")} onCleanup={() => goTo("cleanup")} rule={rule} />
      ) : null}
      {current === "cleanup" && rule ? (
        <RulesPhoneCleanup ctrl={ctrl} key={rule.id} onBack={() => goTo("rule")} rule={rule} />
      ) : null}
      <Sheet onOpenChange={setSheetOpen} open={enabled && sheetOpen && ctrl.mode === "new"}>
        <SheetContent className="max-h-[90dvh] gap-3.5 overflow-y-auto rounded-t-[20px] bg-ops-surface px-4 pt-5 pb-4" side="bottom">
          <div className="flex flex-col gap-0.5">
            <SheetTitle className="text-xl font-bold text-ops-text">Nuevo horario</SheetTitle>
            <SheetDescription className="text-sm text-ops-text-muted">Para {selected?.job.name}</SheetDescription>
          </div>
          <RuleFormFields error={ctrl.formError} form={ctrl.form} mode="new" onChange={ctrl.setForm} todayKey={ctrl.todayKey} />
          <div className="flex gap-2.5">
            <button
              className="min-h-12 rounded-xl border border-ops-border bg-ops-surface px-4 text-[15px] font-semibold text-ops-text"
              onClick={() => setSheetOpen(false)}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-ops-bamboo-strong text-[15px] font-semibold text-white disabled:opacity-45 dark:text-ops-canvas"
              disabled={Boolean(ctrl.formError) || ctrl.mutations.isSaving}
              onClick={() => void saveNew()}
              type="button"
            >
              {ctrl.mutations.isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Guardar horario
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

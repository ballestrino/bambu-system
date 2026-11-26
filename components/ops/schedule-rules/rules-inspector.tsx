"use client";

import { CalendarRange } from "lucide-react";

import { RuleEditor } from "@/components/ops/schedule-rules/rule-editor";
import { RuleJobSummary } from "@/components/ops/schedule-rules/rule-job-summary";
import type { ScheduleRulesController } from "@/components/ops/schedule-rules/use-schedule-rules-controller";

// Panel derecho del escritorio: el trabajo elegido, un horario nuevo o uno
// abierto para editar y limpiar.
export const RulesInspector = ({ bare = false, ctrl }: { bare?: boolean; ctrl: ScheduleRulesController }) => (
  <aside
    aria-label="Detalle"
    className={
      bare
        ? "@container/inspector flex w-full flex-col"
        : "@container/inspector sticky top-4 flex w-full flex-col rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface"
    }
  >
    {!ctrl.selected ? (
      <div className="flex flex-col items-start gap-3 p-6">
        <span className="rounded-[10px] bg-ops-bamboo-soft p-2.5 text-ops-bamboo-strong">
          <CalendarRange className="size-5" />
        </span>
        <h2 className="text-lg font-semibold text-ops-text">Elegí un servicio</h2>
        <p className="text-sm text-ops-text-muted">
          Tocá el nombre de un servicio para ver sus horarios, un día vacío para darle uno nuevo o un horario para
          cambiarlo y limpiar sus visitas.
        </p>
      </div>
    ) : ctrl.mode === "job" ? (
      <div className="p-5">
        <RuleJobSummary ctrl={ctrl} selected={ctrl.selected} />
      </div>
    ) : (
      <RuleEditor ctrl={ctrl} />
    )}
  </aside>
);

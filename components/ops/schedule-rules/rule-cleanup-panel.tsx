"use client";

import { LoaderCircle } from "lucide-react";

import { RuleSegmented } from "@/components/ops/schedule-rules/rule-segmented";
import { RuleWeekStrip } from "@/components/ops/schedule-rules/rule-week-strip";
import { plural } from "@/components/ops/schedule-rules/schedule-rules-model";
import type { RuleCleanupState } from "@/components/ops/schedule-rules/use-rule-cleanup";
import { cn } from "@/lib/utils";

const directionOptions = [
  { label: "Hacia adelante", value: "FORWARD" as const },
  { label: "Hacia atrás", value: "BACK" as const },
];

// Sentido, tira de semanas, resumen y la opción de ajustar la regla. El botón
// de eliminar va aparte: en el celular queda fijo abajo.
export const RuleCleanupBody = ({ cleanup }: { cleanup: RuleCleanupState }) => {
  const { counts } = cleanup;
  const has = counts.deletable > 0;

  return (
    <div className="flex flex-col gap-3.5">
      <RuleSegmented label="Sentido" onChange={cleanup.changeDirection} options={directionOptions} value={cleanup.direction} />
      <p className="text-sm text-ops-text-muted">Se toca la semana de corte.</p>
      {cleanup.error ? (
        <p className="text-sm text-red-700 dark:text-red-300">No se pudieron leer las visitas de este horario.</p>
      ) : (
        <RuleWeekStrip onPick={cleanup.setCutIndex} weeks={cleanup.weeks} />
      )}
      <div
        className={cn(
          "flex flex-col gap-1.5 rounded-xl border p-3.5",
          has ? "border-red-200 bg-red-50 dark:border-red-500/40 dark:bg-red-500/10" : "border-ops-border bg-ops-surface-muted"
        )}
      >
        <p className={cn("text-[15px] font-bold", has ? "text-red-800 dark:text-red-200" : "text-ops-text")}>
          {cleanup.isLoading
            ? "Contando visitas…"
            : has
              ? `Se eliminan ${plural(counts.deletable, "visita", "visitas")}`
              : "No hay visitas para eliminar en ese tramo"}
        </p>
        <p className="text-sm text-ops-text">
          {plural(counts.future, "programada", "programadas")} y {plural(counts.pending, "pendiente", "pendientes")} de registro,{" "}
          {cleanup.rangeLabel}.
        </p>
        {cleanup.outsideLabel ? <p className="text-sm text-ops-text">{cleanup.outsideLabel}</p> : null}
        {counts.kept ? (
          <p className="text-sm text-ops-text">
            Se conservan {plural(counts.kept, "visita realizada, omitida o con horas", "visitas realizadas, omitidas o con horas")}.
          </p>
        ) : null}
      </div>
      <label className="flex min-h-11 items-center gap-2.5 text-sm text-ops-text">
        <input
          checked={cleanup.adjustRule}
          className="size-[18px] shrink-0 accent-[var(--ops-bamboo-strong)]"
          onChange={() => cleanup.setAdjustRule(!cleanup.adjustRule)}
          type="checkbox"
        />
        {cleanup.adjustLabel}
      </label>
    </div>
  );
};

export const RuleCleanupButton = ({ cleanup, className }: { cleanup: RuleCleanupState; className?: string }) => {
  const count = cleanup.counts.deletable;
  const onlyRule = !count && cleanup.adjustRule;
  return (
    <button
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[10px] bg-red-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-45",
        className
      )}
      disabled={cleanup.isRunning || cleanup.isLoading || (!count && !onlyRule)}
      onClick={cleanup.run}
      type="button"
    >
      {cleanup.isRunning ? <LoaderCircle className="size-4 animate-spin" /> : null}
      {count ? `Eliminar ${plural(count, "visita", "visitas")}` : onlyRule ? "Ajustar el horario" : "Eliminar visitas"}
    </button>
  );
};

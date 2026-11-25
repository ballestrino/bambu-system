"use client";

import { Check, Minus } from "lucide-react";

import type { PendingWeekday } from "@/lib/ops/pending-visit-groups";
import type { PendingCheck } from "@/components/ops/visits/pending/use-pending-view";
import { cn } from "@/lib/utils";

const DAY_NAMES: Record<number, string> = {
  1: "los lunes",
  2: "los martes",
  3: "los miércoles",
  4: "los jueves",
  5: "los viernes",
  6: "los sábados",
  7: "los domingos",
};

// "Por día" de un trabajo: cada chip elige (o suelta) todas sus visitas de ese
// dia de la semana, por ejemplo todos los miercoles de Godoy, para borrar de
// una vez una generacion mala.
export const PendingWeekdayChips = ({
  check,
  jobName,
  onToggle,
  weekdays,
}: {
  check: (ids: string[]) => PendingCheck;
  jobName: string;
  onToggle: (ids: string[]) => void;
  weekdays: PendingWeekday[];
}) => (
  <div className="flex flex-wrap items-center gap-1.5 border-t border-ops-surface-muted py-2 pr-3 pl-14">
    <span className="mr-1 text-xs font-semibold text-ops-text-muted">Elegir por día</span>
    {weekdays.map((day) => {
      const state = check(day.ids);
      return (
        <button
          aria-label={`${state === true ? "Soltar" : "Elegir"} ${DAY_NAMES[day.weekday]} de ${jobName}: ${day.ids.length}`}
          aria-pressed={state === true ? true : state === "indeterminate" ? "mixed" : false}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-semibold transition-colors",
            state === true
              ? "border-ops-bamboo-strong bg-ops-bamboo-strong text-white dark:text-ops-canvas"
              : state === "indeterminate"
                ? "border-ops-bamboo/50 bg-ops-bamboo-soft text-ops-bamboo-strong"
                : "border-ops-border bg-ops-surface text-ops-text hover:border-ops-bamboo/60"
          )}
          key={day.weekday}
          onClick={() => onToggle(day.ids)}
          type="button"
        >
          {state === true ? <Check className="size-3.5" /> : state === "indeterminate" ? <Minus className="size-3.5" /> : null}
          {day.label}
          <span className={cn("tabular-nums", state === true ? "opacity-80" : "text-ops-text-muted")}>{day.ids.length}</span>
        </button>
      );
    })}
  </div>
);

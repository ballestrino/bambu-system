"use client";

import type { StripDot, StripWeek } from "@/components/ops/schedule-rules/rule-week-strip-model";
import { dayLabel, plural } from "@/components/ops/schedule-rules/schedule-rules-model";
import { cn } from "@/lib/utils";

const dotClass = (dot: StripDot) => {
  if (dot.inside && dot.deletable) return "border-red-600 bg-white dark:bg-ops-surface";
  if (dot.state === "done") return "border-ops-bamboo-strong bg-ops-bamboo-strong";
  if (dot.state === "pending") return "border-ops-amber bg-ops-amber";
  if (dot.state === "off") return "border-ops-text-muted/50 bg-ops-text-muted/30";
  return "border-ops-bamboo bg-transparent";
};

const legend = [
  { className: "border-ops-bamboo-strong bg-ops-bamboo-strong", label: "Realizada" },
  { className: "border-ops-amber bg-ops-amber", label: "Pendiente de registro" },
  { className: "border-ops-bamboo bg-transparent", label: "Programada" },
  { className: "border-red-600 bg-red-50 dark:bg-red-500/15", label: "Se elimina" },
];

// 16 semanas con las visitas de la regla. Tocar una semana la elige como corte.
export const RuleWeekStrip = ({ onPick, weeks }: { onPick: (index: number) => void; weeks: StripWeek[] }) => (
  <div className="flex flex-col gap-3">
    <div className="flex flex-col gap-1 rounded-xl border border-ops-border bg-ops-surface p-2.5">
      <div className="grid grid-cols-16 gap-0.5">
        {weeks.map((week) => (
          <span className={cn("h-3.5 overflow-visible text-[10px] font-semibold whitespace-nowrap", week.isCurrent ? "text-ops-bamboo-strong" : "text-ops-text-muted")} key={week.mondayKey}>
            {week.top}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-16 gap-0.5">
        {weeks.map((week) => (
          <button
            aria-label={`Semana del ${dayLabel(week.mondayKey)}: ${plural(week.dots.length, "visita", "visitas")}. Cortar acá.`}
            aria-pressed={week.isCut}
            className={cn(
              "flex h-24 flex-col items-center justify-end gap-0.5 rounded-md py-1.5",
              week.isCut ? "border-2 border-red-600" : "border",
              !week.isCut && (week.inside ? "border-red-200 dark:border-red-500/40" : week.isCurrent ? "border-ops-bamboo" : "border-ops-border/70"),
              week.inside ? "bg-red-50 dark:bg-red-500/10" : week.isCurrent ? "bg-ops-bamboo-soft" : "bg-ops-surface-muted/60"
            )}
            key={week.mondayKey}
            onClick={() => onPick(week.index)}
            type="button"
          >
            {week.dots.slice(0, 8).map((dot) => (
              <span className={cn("h-2 w-[9px] shrink-0 rounded-[2px] border-[1.5px]", dotClass(dot))} key={dot.id} />
            ))}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-16 gap-0.5">
        {weeks.map((week) => (
          <span className={cn("text-center text-[10px]", week.isCurrent ? "font-bold text-ops-bamboo-strong" : "text-ops-text-muted")} key={week.mondayKey}>
            {week.dayNumber}
          </span>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-ops-text-muted @md/inspector:flex @md/inspector:flex-wrap">
      {legend.map((item) => (
        <span className="flex items-center gap-1.5" key={item.label}>
          <span className={cn("size-2.5 rounded-[2px] border-[1.5px]", item.className)} />
          {item.label}
        </span>
      ))}
    </div>
  </div>
);

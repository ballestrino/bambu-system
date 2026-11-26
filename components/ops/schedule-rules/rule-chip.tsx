"use client";

import {
  clock,
  durationLabel,
  isEndedRule,
  ruleDaysLabel,
  ruleTimeLabel,
  type BoardRule,
} from "@/components/ops/schedule-rules/schedule-rules-model";
import { cn } from "@/lib/utils";

// Un horario en la matriz: entrada arriba, salida (o "venció") abajo.
// Seleccionado va lleno; si se cruza con otro, ámbar; vencido, punteado.
export const RuleChip = ({
  flagged,
  jobName,
  onOpen,
  rule,
  selected,
  todayKey,
}: {
  flagged: boolean;
  jobName: string;
  onOpen: () => void;
  rule: BoardRule;
  selected: boolean;
  todayKey: string;
}) => {
  const ended = isEndedRule(rule, todayKey);
  const monthly = rule.frequency === "MONTHLY";
  const every = rule.interval > 1 && rule.frequency === "WEEKLY" ? ` · c/${rule.interval} sem` : "";

  return (
    <button
      aria-label={`Horario de ${jobName}: ${ruleDaysLabel(rule)}, ${ruleTimeLabel(rule)}${ended ? ", vencido" : ""}`}
      aria-pressed={selected}
      className={cn(
        "flex min-h-[42px] w-full flex-col items-start gap-px rounded-lg border-[1.5px] px-2 py-1 text-left transition-colors",
        selected
          ? "border-ops-bamboo-strong bg-ops-bamboo-strong text-white dark:text-ops-canvas"
          : ended
            ? "border-dashed border-ops-text-muted/50 bg-transparent text-ops-text-muted"
            : flagged
              ? "border-amber-500 bg-amber-50 text-ops-text hover:bg-amber-100 dark:bg-amber-500/15"
              : "border-ops-border bg-ops-surface text-ops-text hover:border-ops-bamboo/50"
      )}
      onClick={onOpen}
      type="button"
    >
      <span className={cn("text-[13px] leading-tight font-semibold", ended && !selected && "line-through")}>
        {monthly ? `Día ${rule.dayOfMonth}` : clock(rule.startTimeMinutes)}
      </span>
      <span className={cn("text-[11px] leading-tight", selected ? "text-white/80 dark:text-ops-canvas/80" : "text-ops-text-muted")}>
        {monthly
          ? `${clock(rule.startTimeMinutes)} · ${durationLabel(rule.durationMinutes)}`
          : ended
            ? "venció"
            : `a ${clock(rule.startTimeMinutes + rule.durationMinutes)}${every}`}
      </span>
    </button>
  );
};

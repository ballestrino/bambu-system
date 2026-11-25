"use client";

import { CalendarRange, ClipboardList, Columns3, List, ListChecks, type LucideIcon } from "lucide-react";

import type { VisitsView } from "@/components/ops/visits/hooks/use-visits-desk";
import { cn } from "@/lib/utils";

type ViewOption = { icon: LucideIcon; label: string; value: VisitsView };

const DESKTOP_VIEWS: ViewOption[] = [
  { icon: ListChecks, label: "Agenda", value: "agenda" },
  { icon: Columns3, label: "Día por empleada", value: "dia" },
  { icon: CalendarRange, label: "Cronograma", value: "cron" },
  { icon: ClipboardList, label: "Pendientes", value: "pendientes" },
];

// En el celular no entra la grilla por empleada: Agenda, Cronograma y
// Pendientes, con ícono.
const MOBILE_VIEWS: ViewOption[] = [
  { icon: List, label: "Agenda", value: "agenda" },
  { icon: CalendarRange, label: "Cronograma", value: "cron" },
  { icon: ClipboardList, label: "Pendientes", value: "pendientes" },
];

const badgeClass =
  "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-amber-100 px-1.5 text-[11px] font-bold text-amber-800 tabular-nums dark:bg-amber-500/25 dark:text-amber-200";

export const VisitsViewToggle = ({
  compact = false,
  onChange,
  pendingCount = 0,
  value,
}: {
  compact?: boolean;
  onChange: (view: VisitsView) => void;
  pendingCount?: number;
  value: VisitsView;
}) => {
  const options = compact ? MOBILE_VIEWS : DESKTOP_VIEWS;
  const current = compact && value === "dia" ? "agenda" : value;

  return (
    <div aria-label="Vista" className="flex rounded-[11px] bg-ops-surface-muted p-[3px]" role="radiogroup">
      {options.map(({ icon: Icon, label, value: option }) => {
        const active = option === current;
        const count = option === "pendientes" ? pendingCount : 0;

        return (
          <button
            aria-checked={active}
            aria-label={compact ? (count ? `${label}: ${count}` : label) : undefined}
            className={cn(
              "relative inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors",
              compact ? "h-[38px] w-11" : "h-[34px] px-3.5",
              active
                ? "bg-ops-surface text-ops-bamboo-strong shadow-[0_1px_3px_rgb(24_37_29/0.14)]"
                : "text-ops-text/75 hover:text-ops-text"
            )}
            key={option}
            onClick={() => onChange(option)}
            role="radio"
            type="button"
          >
            <Icon className={compact ? "size-[19px]" : "size-[15px]"} />
            {compact ? null : label}
            {count ? (
              <span className={cn(badgeClass, compact && "absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9.5px]")}>
                {count > 999 ? "999+" : count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

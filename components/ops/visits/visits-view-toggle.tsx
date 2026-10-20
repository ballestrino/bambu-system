"use client";

import { CalendarRange, Columns3, List, ListChecks, type LucideIcon } from "lucide-react";

import type { VisitsView } from "@/components/ops/visits/hooks/use-visits-desk";
import { cn } from "@/lib/utils";

type ViewOption = { icon: LucideIcon; label: string; value: VisitsView };

const DESKTOP_VIEWS: ViewOption[] = [
  { icon: ListChecks, label: "Agenda", value: "agenda" },
  { icon: Columns3, label: "Día por empleada", value: "dia" },
  { icon: CalendarRange, label: "Cronograma", value: "cron" },
];

// En el celular no entra la grilla por empleada: Agenda y Cronograma, con ícono.
const MOBILE_VIEWS: ViewOption[] = [
  { icon: List, label: "Agenda", value: "agenda" },
  { icon: CalendarRange, label: "Cronograma", value: "cron" },
];

export const VisitsViewToggle = ({
  compact = false,
  onChange,
  value,
}: {
  compact?: boolean;
  onChange: (view: VisitsView) => void;
  value: VisitsView;
}) => {
  const options = compact ? MOBILE_VIEWS : DESKTOP_VIEWS;
  const current = compact && value === "dia" ? "agenda" : value;

  return (
    <div aria-label="Vista" className="flex rounded-[11px] bg-ops-surface-muted p-[3px]" role="radiogroup">
      {options.map(({ icon: Icon, label, value: option }) => {
        const active = option === current;

        return (
          <button
            aria-checked={active}
            aria-label={compact ? label : undefined}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors",
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
          </button>
        );
      })}
    </div>
  );
};

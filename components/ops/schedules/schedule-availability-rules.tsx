"use client";

import { Trash2 } from "lucide-react";

import { formatMinuteOfDay, formatMinuteRange } from "@/lib/ops/minute-ranges";
import {
  DEFAULT_AVAILABILITY_WINDOW,
  formatAvailabilityWeekdays,
} from "@/lib/ops/schedule-availability";
import type { OpsEmployeeAvailabilityRule } from "@/components/ops/types";
import { Button } from "@/components/ui/button";

export const ScheduleAvailabilityRules = ({
  isDeleting,
  onDelete,
  rules,
}: {
  isDeleting: boolean;
  onDelete: (ruleId: string) => void;
  rules: OpsEmployeeAvailabilityRule[];
}) => {
  if (!rules.length) {
    return (
      <p className="rounded-[var(--ops-radius-row)] border border-dashed border-ops-border p-3 text-sm text-muted-foreground">
        Sin reglas cargadas. El cronograma la considera disponible de{" "}
        {formatMinuteOfDay(DEFAULT_AVAILABILITY_WINDOW.startMinute)} a{" "}
        {formatMinuteOfDay(DEFAULT_AVAILABILITY_WINDOW.endMinute)} todos los días.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-ops-border rounded-[var(--ops-radius-row)] border border-ops-border">
      {rules.map((rule) => (
        <li className="flex items-start justify-between gap-2 px-3 py-2" key={rule.id}>
          <div className="min-w-0">
            <p className="text-sm font-medium text-ops-text">
              {rule.kind === "AVAILABLE" ? "Solo disponible" : "No disponible"} ·{" "}
              {formatMinuteRange(rule)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatAvailabilityWeekdays(rule.weekdays)}
              {rule.note ? ` · ${rule.note}` : ""}
            </p>
          </div>
          <Button
            aria-label="Eliminar regla"
            disabled={isDeleting}
            onClick={() => onDelete(rule.id)}
            size="sm"
            type="button"
            variant="ghost"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
};

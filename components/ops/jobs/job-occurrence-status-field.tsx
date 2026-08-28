"use client";

import { useId } from "react";

import {
  getOpsStatusConfig,
  OpsFormField,
  opsOccurrenceStatus,
  opsToneClasses,
} from "@/components/ops/shared";
import { cn } from "@/lib/utils";
import { occurrenceStatusValues } from "@/schemas/ops";

type OccurrenceStatus = (typeof occurrenceStatusValues)[number];

export const occurrenceStatusInputClass =
  "peer absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0";

export const JobOccurrenceStatusField = ({
  onChange,
  value,
}: {
  onChange: (value: OccurrenceStatus) => void;
  value: OccurrenceStatus;
}) => {
  const groupName = useId();

  return (
    <OpsFormField label="Estado">
      <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Estado">
        {occurrenceStatusValues.map((status) => {
          const config = getOpsStatusConfig(opsOccurrenceStatus, status);
          const isSelected = value === status;

          return (
            <label key={status} className="relative block cursor-pointer">
              <input
                checked={isSelected}
                className={occurrenceStatusInputClass}
                name={groupName}
                type="radio"
                value={status}
                onChange={() => onChange(status)}
              />
              <span
                className={cn(
                  "flex min-h-14 items-center justify-center rounded-md border px-2 py-2 text-center text-xs font-medium transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-ops-bamboo/50 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-ops-canvas",
                  isSelected
                    ? cn(opsToneClasses[config.tone], "ring-2 ring-current/20")
                    : "border-border bg-background text-muted-foreground hover:border-[#53985E]/30 hover:bg-[#F7FBF7] dark:hover:bg-[#1A211A]"
                )}
              >
                {config.label}
              </span>
            </label>
          );
        })}
      </div>
    </OpsFormField>
  );
};

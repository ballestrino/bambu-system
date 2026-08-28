"use client";

import { OpsFormField, OpsFormGrid, opsFormControlClass } from "@/components/ops/shared";
import {
  getDateTimePart,
  updateOccurrenceDateTimeRange,
  type DateTimePart,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const JobOccurrenceDateTimeFields = ({
  endLabel,
  endValue,
  onChange,
  startLabel,
  startValue,
}: {
  endLabel: string;
  endValue: string;
  onChange: (range: { endValue: string; startValue: string }) => void;
  startLabel: string;
  startValue: string;
}) => {
  const updatePart = (
    field: "end" | "start",
    part: DateTimePart,
    nextPart: string
  ) => {
    const nextRange = updateOccurrenceDateTimeRange({
      endValue,
      field,
      nextPart,
      part,
      startValue,
    });

    if (
      nextRange.startValue !== startValue ||
      nextRange.endValue !== endValue
    ) {
      onChange(nextRange);
    }
  };

  return (
    <OpsFormGrid>
      {[{
        label: startLabel,
        onChange: (part: DateTimePart, value: string) =>
          updatePart("start", part, value),
        value: startValue,
      }, {
        label: endLabel,
        onChange: (part: DateTimePart, value: string) =>
          updatePart("end", part, value),
        value: endValue,
      }].map((field) => (
        <OpsFormField className="min-w-0" key={field.label} label={field.label}>
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:gap-2">
            {[{ label: "Fecha", part: "date" }, { label: "Hora", part: "time" }].map(({ label, part }) => {
              const dateTimePart = part as DateTimePart;
              const partValue = getDateTimePart(field.value, dateTimePart);

              return (
                <label className="min-w-0 space-y-1.5" key={part}>
                  <span className="block text-xs text-ops-text-muted sm:sr-only">{label}</span>
                  <span className="relative block min-w-0">
                    <Input
                      aria-label={`${field.label}: ${label.toLocaleLowerCase("es-UY")}`}
                      className={cn(
                        opsFormControlClass,
                        "min-w-0 max-w-full [color-scheme:light] dark:[color-scheme:dark]"
                      )}
                      type={part}
                      value={partValue}
                      onInput={(event) =>
                        field.onChange(dateTimePart, event.currentTarget.value)
                      }
                      onChange={(event) =>
                        field.onChange(dateTimePart, event.target.value)
                      }
                    />
                    {!partValue ? (
                      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-ops-text-muted sm:hidden">
                        Seleccionar {label.toLocaleLowerCase("es-UY")}
                      </span>
                    ) : null}
                  </span>
                </label>
              );
            })}
          </div>
        </OpsFormField>
      ))}
    </OpsFormGrid>
  );
};

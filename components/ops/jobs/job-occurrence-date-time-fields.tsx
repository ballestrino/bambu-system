"use client";

import { OpsFormField, OpsFormGrid, opsFormControlClass } from "@/components/ops/shared";
import {
  getDateTimePart,
  updateOccurrenceDateTimeRange,
  type DateTimePart,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { Input } from "@/components/ui/input";

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
        <OpsFormField key={field.label} label={field.label}>
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-2">
            <Input
              aria-label={`${field.label}: fecha`}
              className={opsFormControlClass}
              type="date"
              value={getDateTimePart(field.value, "date")}
              onInput={(event) =>
                field.onChange("date", event.currentTarget.value)
              }
              onChange={(event) => field.onChange("date", event.target.value)}
            />
            <Input
              aria-label={`${field.label}: hora`}
              className={opsFormControlClass}
              type="time"
              value={getDateTimePart(field.value, "time")}
              onInput={(event) =>
                field.onChange("time", event.currentTarget.value)
              }
              onChange={(event) => field.onChange("time", event.target.value)}
            />
          </div>
        </OpsFormField>
      ))}
    </OpsFormGrid>
  );
};

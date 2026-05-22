"use client";

import {
  OpsFormField,
  OpsFormGrid,
  opsFormControlClass,
  opsFormSelectTriggerClass,
} from "@/components/ops/shared";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { JobType } from "@prisma/client";

export const JobTypeFields = ({
  jobType,
  onJobTypeChange,
  onPunctualEndDateChange,
  onPunctualStartDateChange,
  punctualEndDate,
  punctualStartDate,
}: {
  jobType: JobType;
  onJobTypeChange: (jobType: JobType) => void;
  onPunctualEndDateChange: (date: string) => void;
  onPunctualStartDateChange: (date: string) => void;
  punctualEndDate: string;
  punctualStartDate: string;
}) => (
  <div className="grid gap-4">
    <OpsFormField label="Tipo" className="md:max-w-[calc(50%-0.5rem)]">
      <Select
        value={jobType}
        onValueChange={(value) => onJobTypeChange(value as JobType)}
      >
        <SelectTrigger className={opsFormSelectTriggerClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ONGOING">Recurrente</SelectItem>
          <SelectItem value="PUNCTUAL">Puntual</SelectItem>
        </SelectContent>
      </Select>
    </OpsFormField>
    {jobType === "PUNCTUAL" ? (
      <OpsFormGrid>
        <OpsFormField label="Desde">
          <Input
            className={opsFormControlClass}
            type="date"
            value={punctualStartDate}
            onChange={(event) =>
              onPunctualStartDateChange(event.target.value)
            }
          />
        </OpsFormField>
        <OpsFormField label="Hasta">
          <Input
            className={opsFormControlClass}
            type="date"
            value={punctualEndDate}
            onChange={(event) =>
              onPunctualEndDateChange(event.target.value)
            }
          />
        </OpsFormField>
      </OpsFormGrid>
    ) : null}
  </div>
);

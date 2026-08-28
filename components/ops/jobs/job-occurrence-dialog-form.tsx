"use client";

import type { Dispatch, SetStateAction } from "react";
import { ClockArrowUp } from "lucide-react";

import {
  clearOccurrenceActualTimes,
  syncOccurrenceActualTimes,
  updateOccurrenceScheduledTime,
  type JobOccurrenceEmployeeOption,
  type OccurrenceFormState,
} from "@/components/ops/jobs/job-occurrence-dialog-utils";
import { JobOccurrenceDateTimeFields } from "@/components/ops/jobs/job-occurrence-date-time-fields";
import { JobOccurrenceEmployeeField } from "@/components/ops/jobs/job-occurrence-employee-field";
import {
  getJobScheduleRuleOptionLabel,
  type JobScheduleRuleOption,
} from "@/components/ops/jobs/job-schedule-rule-label";
import { JobOccurrenceStatusField } from "@/components/ops/jobs/job-occurrence-status-field";
import {
  OpsFormField,
  opsFormSelectTriggerClass,
  opsFormTextareaClass,
} from "@/components/ops/shared";
import type {
  OpsJobListItem,
  OpsOccurrence,
} from "@/components/ops/types";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { occurrenceStatusValues } from "@/schemas/ops";

type OccurrenceStatus = (typeof occurrenceStatusValues)[number];

export const JobOccurrenceDialogForm = ({
  employees,
  formState,
  jobs,
  occurrence,
  resolvedJobId,
  scheduleRuleOptions,
  selectedScheduleRuleId,
  setFormState,
  showJobField,
}: {
  employees: JobOccurrenceEmployeeOption[];
  formState: OccurrenceFormState;
  jobs: OpsJobListItem[];
  occurrence?: OpsOccurrence;
  resolvedJobId: string;
  scheduleRuleOptions: JobScheduleRuleOption[];
  selectedScheduleRuleId: string;
  setFormState: Dispatch<SetStateAction<OccurrenceFormState>>;
  showJobField: boolean;
}) => {
  const updateScheduledRange = ({
    endValue,
    startValue,
  }: {
    endValue: string;
    startValue: string;
  }) => setFormState((current) => {
    let next = current;
    if (startValue !== current.scheduledStartAt) {
      next = updateOccurrenceScheduledTime({
        field: "scheduledStartAt",
        formState: next,
        occurrence,
        value: startValue,
      });
    }
    if (endValue !== current.scheduledEndAt) {
      next = updateOccurrenceScheduledTime({
        field: "scheduledEndAt",
        formState: next,
        occurrence,
        value: endValue,
      });
    }
    return next;
  });

  return (
    <>
      {showJobField ? (
        <OpsFormField label="Trabajo">
          <SearchableSelect
            aria-label="Seleccionar trabajo"
            className={opsFormSelectTriggerClass}
            onValueChange={(jobId) => setFormState((current) => ({ ...current, jobId }))}
            options={jobs.map((job) => ({ label: job.name, value: job.id }))}
            placeholder="Seleccionar trabajo"
            searchPlaceholder="Buscar trabajo..."
            value={formState.jobId}
          />
        </OpsFormField>
      ) : null}
      <JobOccurrenceEmployeeField
        employees={employees}
        selectedEmployeeIds={formState.employeeIds}
        onChange={(employeeIds) => setFormState((current) => ({ ...current, employeeIds }))}
      />
      <OpsFormField label="Regla opcional">
        <Select
          disabled={!resolvedJobId}
          value={selectedScheduleRuleId || "none"}
          onValueChange={(value) => setFormState((current) => ({ ...current, scheduleRuleId: value === "none" ? "" : value }))}
        >
          <SelectTrigger className={opsFormSelectTriggerClass}><SelectValue placeholder={resolvedJobId ? "Sin regla vinculada" : "Selecciona un trabajo primero"} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sin regla</SelectItem>
            {scheduleRuleOptions.map((rule) => <SelectItem key={rule.id} value={rule.id}>{getJobScheduleRuleOptionLabel(rule)}</SelectItem>)}
          </SelectContent>
        </Select>
      </OpsFormField>
      <JobOccurrenceDateTimeFields
        startLabel="Inicio programado"
        endLabel="Fin programado"
        startValue={formState.scheduledStartAt}
        endValue={formState.scheduledEndAt}
        onChange={updateScheduledRange}
      />
      <div className="flex items-center justify-between gap-3 rounded-md border border-[#53985E]/15 bg-[#F7FBF7] px-3 py-2 text-sm text-[#244C2D] dark:bg-[#1A211A] dark:text-[#F0F3E8]">
        <span>Horario real</span>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => setFormState(clearOccurrenceActualTimes(formState))}>Limpiar</Button>
          <Button type="button" variant="outline" size="sm" className="h-9" disabled={!formState.scheduledStartAt || !formState.scheduledEndAt} onClick={() => setFormState(syncOccurrenceActualTimes(formState))}>
            <ClockArrowUp className="h-4 w-4" /> Sincronizar
          </Button>
        </div>
      </div>
      <JobOccurrenceDateTimeFields
        startLabel="Inicio real"
        endLabel="Fin real"
        startValue={formState.actualStartAt}
        endValue={formState.actualEndAt}
        onChange={({ startValue: actualStartAt, endValue: actualEndAt }) =>
          setFormState((current) => ({
            ...current,
            actualStartAt,
            actualEndAt,
          }))
        }
      />
      <JobOccurrenceStatusField
        value={formState.status as OccurrenceStatus}
        onChange={(status) => setFormState((current) => ({ ...current, status }))}
      />
      <OpsFormField label="Notas">
        <Textarea className={opsFormTextareaClass} value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} />
      </OpsFormField>
    </>
  );
};

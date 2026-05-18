"use client";

import {
  getOpsStatusConfig,
  OpsDateFilterInput,
  OpsFilterChips,
  OpsFilterField,
  OpsFilterSheet,
  OpsToolbar,
  opsFilterControlClass,
  opsPaymentStatus,
  type OpsFilterChip,
} from "@/components/ops/shared";
import type { OpsJobListItem } from "@/components/ops/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PaymentsFiltersProps = {
  endDate: string;
  jobId: string;
  jobs: OpsJobListItem[];
  onClear: () => void;
  onEndDateChange: (value: string) => void;
  onJobIdChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  startDate: string;
  status: string;
};

export const PaymentsFilters = ({
  endDate,
  jobId,
  jobs,
  onClear,
  onEndDateChange,
  onJobIdChange,
  onStartDateChange,
  onStatusChange,
  startDate,
  status,
}: PaymentsFiltersProps) => {
  const selectedStatus =
    status === "ALL" ? null : getOpsStatusConfig(opsPaymentStatus, status);
  const selectedJob = jobs.find((job) => job.id === jobId);
  const chips = [
    startDate ? { label: `Desde: ${startDate}`, onRemove: () => onStartDateChange("") } : null,
    endDate ? { label: `Hasta: ${endDate}`, onRemove: () => onEndDateChange("") } : null,
    selectedStatus ? { label: `Estado: ${selectedStatus.label}`, onRemove: () => onStatusChange("ALL") } : null,
    selectedJob ? { label: `Trabajo: ${selectedJob.name}`, onRemove: () => onJobIdChange("ALL") } : null,
  ].filter(Boolean) as OpsFilterChip[];

  const startField = (
    <OpsFilterField label="Desde">
      <OpsDateFilterInput
        value={startDate}
        onChange={(event) => onStartDateChange(event.target.value)}
      />
    </OpsFilterField>
  );

  const endField = (
    <OpsFilterField label="Hasta">
      <OpsDateFilterInput
        value={endDate}
        onChange={(event) => onEndDateChange(event.target.value)}
      />
    </OpsFilterField>
  );

  const statusField = (
    <OpsFilterField label="Estado">
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className={opsFilterControlClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          <SelectItem value="RECORDED">Registrados</SelectItem>
          <SelectItem value="VOIDED">Anulados</SelectItem>
        </SelectContent>
      </Select>
    </OpsFilterField>
  );

  const jobField = (
    <OpsFilterField label="Trabajo">
      <Select value={jobId} onValueChange={onJobIdChange}>
        <SelectTrigger className={opsFilterControlClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos</SelectItem>
          {jobs.map((job) => (
            <SelectItem key={job.id} value={job.id}>
              {job.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </OpsFilterField>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        <OpsFilterSheet
          activeCount={chips.length}
          description="Ajusta periodo, estado y trabajo para revisar cobros."
          onClear={onClear}
        >
          {startField}
          {endField}
          {statusField}
          {jobField}
        </OpsFilterSheet>
        <OpsFilterChips chips={chips} onClear={onClear} />
      </div>

      <div className="hidden space-y-3 md:block">
        <OpsToolbar summary={`${chips.length} filtro(s) activo(s)`}>
          {startField}
          {endField}
          {statusField}
          {jobField}
        </OpsToolbar>
        <OpsFilterChips chips={chips} onClear={onClear} />
      </div>
    </div>
  );
};

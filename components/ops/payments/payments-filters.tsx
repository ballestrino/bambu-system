"use client";

import {
  getOpsStatusConfig,
  OpsFilterChips,
  OpsFilterField,
  OpsFilterSheet,
  OpsRefreshButton,
  OpsToolbar,
  opsFilterControlClass,
  opsPaymentStatus,
  type OpsFilterChip,
} from "@/components/ops/shared";
import type { OpsJobListItem } from "@/components/ops/types";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PaymentsFiltersProps = {
  jobId: string;
  jobs: OpsJobListItem[];
  isRefreshing?: boolean;
  monthLabel: string;
  onClear: () => void;
  onJobIdChange: (value: string) => void;
  onRefresh: () => Promise<unknown> | void;
  onStatusChange: (value: string) => void;
  status: string;
};

export const PaymentsFilters = ({
  jobId,
  jobs,
  isRefreshing,
  monthLabel,
  onClear,
  onJobIdChange,
  onRefresh,
  onStatusChange,
  status,
}: PaymentsFiltersProps) => {
  const selectedStatus =
    status === "ALL" ? null : getOpsStatusConfig(opsPaymentStatus, status);
  const selectedJob = jobs.find((job) => job.id === jobId);
  const chips = [
    { label: `Mes: ${monthLabel}` },
    selectedStatus ? { label: `Estado: ${selectedStatus.label}`, onRemove: () => onStatusChange("ALL") } : null,
    selectedJob ? { label: `Trabajo: ${selectedJob.name}`, onRemove: () => onJobIdChange("ALL") } : null,
  ].filter(Boolean) as OpsFilterChip[];

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
      <SearchableSelect
        aria-label="Filtrar por trabajo"
        className={opsFilterControlClass}
        onValueChange={onJobIdChange}
        options={[
          { label: "Todos", value: "ALL" },
          ...jobs.map((job) => ({ label: job.name, value: job.id })),
        ]}
        searchPlaceholder="Buscar trabajo..."
        value={jobId}
      />
    </OpsFilterField>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        <div className="flex gap-2">
          <OpsFilterSheet
            activeCount={chips.length}
            description="Ajusta estado y trabajo para revisar cobros."
            onClear={onClear}
          >
            {statusField}
            {jobField}
          </OpsFilterSheet>
          <OpsRefreshButton
            className="px-3"
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        </div>
        <OpsFilterChips chips={chips} onClear={onClear} />
      </div>

      <div className="hidden space-y-3 md:block">
        <OpsToolbar summary={`${chips.length} filtro(s) activo(s)`}>
          {statusField}
          {jobField}
          <OpsRefreshButton
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
          />
        </OpsToolbar>
        <OpsFilterChips chips={chips} onClear={onClear} />
      </div>
    </div>
  );
};

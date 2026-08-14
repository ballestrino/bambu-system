"use client";

import {
  OpsFilterChips,
  OpsFilterSheet,
  OpsRefreshButton,
  OpsSearchInput,
  OpsToolbar,
  getOpsStatusConfig,
  opsFilterControlClass,
  opsFilterToggleClass,
  opsJobStatus,
  opsSwitchClass,
  type OpsFilterChip,
} from "@/components/ops/shared";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { jobStatusValues } from "@/schemas/ops";

interface JobFiltersProps {
  visibility: string;
  query: string;
  status: string;
  profitability: string;
  includeArchived: boolean;
  onVisibilityChange: (value: string) => void;
  onQueryChange: (value: string) => void;
  onRefresh: () => Promise<unknown> | void;
  onStatusChange: (value: string) => void;
  onProfitabilityChange: (value: string) => void;
  onIncludeArchivedChange: (value: boolean) => void;
  onClear: () => void;
  isRefreshing?: boolean;
}

export const JobFilters = ({
  query,
  profitability,
  status,
  visibility,
  includeArchived,
  isRefreshing,
  onClear,
  onQueryChange,
  onProfitabilityChange,
  onRefresh,
  onStatusChange,
  onVisibilityChange,
  onIncludeArchivedChange,
}: JobFiltersProps) => {
  const selectedStatus =
    status === "all" ? null : getOpsStatusConfig(opsJobStatus, status);
  const chips = [
    query.trim()
      ? { label: `Busca "${query.trim()}"`, onRemove: () => onQueryChange("") }
      : null,
    selectedStatus
      ? { label: `Estado: ${selectedStatus.label}`, onRemove: () => onStatusChange("all") }
      : null,
    includeArchived
      ? { label: "Incluye archivados", onRemove: () => onIncludeArchivedChange(false) }
      : null,
    visibility !== "DEFAULT"
      ? { label: visibility === "PUNCTUAL" ? "Puntuales" : "Todos", onRemove: () => onVisibilityChange("DEFAULT") }
      : null,
    profitability === "attention"
      ? { label: "Requiere atención", onRemove: () => onProfitabilityChange("all") }
      : null,
  ].filter(Boolean) as OpsFilterChip[];

  const searchField = (
    <OpsSearchInput
      value={query}
      onChange={onQueryChange}
      placeholder="Buscar por nombre, descripción o ubicación"
    />
  );

  const statusField = (
    <div className="space-y-2 md:w-56 md:space-y-0">
      <Label className="md:hidden">Estado</Label>
      <Select value={status} onValueChange={onStatusChange}>
        <SelectTrigger className={opsFilterControlClass}>
          <SelectValue placeholder="Todos los estados" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos los estados</SelectItem>
          {jobStatusValues.map((value) => (
            <SelectItem key={value} value={value}>
              {getOpsStatusConfig(opsJobStatus, value).label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const archivedField = (
    <label className={opsFilterToggleClass}>
      Incluir archivados
      <Switch
        checked={includeArchived}
        className={opsSwitchClass}
        onCheckedChange={onIncludeArchivedChange}
      />
    </label>
  );

  const profitabilityField = (
    <div className="space-y-2 md:w-56 md:space-y-0">
      <Label className="md:hidden">Rentabilidad</Label>
      <Select value={profitability} onValueChange={onProfitabilityChange}>
        <SelectTrigger className={opsFilterControlClass}><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Toda rentabilidad</SelectItem>
          <SelectItem value="attention">Requiere atención</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const visibilityField = (
    <div className="space-y-2 md:w-56 md:space-y-0">
      <Label className="md:hidden">Vista</Label>
      <Select value={visibility} onValueChange={onVisibilityChange}>
        <SelectTrigger className={opsFilterControlClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="DEFAULT">Actuales</SelectItem>
          <SelectItem value="PUNCTUAL">Puntuales</SelectItem>
          <SelectItem value="ALL">Todos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        <div className="flex gap-2">
          {searchField}
          <OpsFilterSheet
            activeCount={chips.length}
            description="Ajusta estado y archivo para encontrar trabajos."
            onClear={onClear}
          >
            {statusField}
            {visibilityField}
            {profitabilityField}
            {archivedField}
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
          {searchField}
          {statusField}
          {visibilityField}
          {profitabilityField}
          {archivedField}
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

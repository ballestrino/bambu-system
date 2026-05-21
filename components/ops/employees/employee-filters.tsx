"use client";

import {
  OpsFilterChips,
  OpsFilterSheet,
  OpsRefreshButton,
  OpsSearchInput,
  OpsToolbar,
  opsFilterControlClass,
  opsFilterToggleClass,
  opsSwitchClass,
  type OpsFilterChip,
} from "@/components/ops/shared";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const activeFilterLabels: Record<string, string> = {
  active: "Activos",
  all: "Todos",
  inactive: "Inactivos",
};

export const EmployeeFilters = ({
  query,
  activeFilter,
  includeArchived,
  isRefreshing,
  onClear,
  onQueryChange,
  onRefresh,
  onActiveFilterChange,
  onIncludeArchivedChange,
}: {
  query: string;
  activeFilter: string;
  includeArchived: boolean;
  isRefreshing?: boolean;
  onClear: () => void;
  onQueryChange: (value: string) => void;
  onRefresh: () => Promise<unknown> | void;
  onActiveFilterChange: (value: string) => void;
  onIncludeArchivedChange: (value: boolean) => void;
}) => {
  const chips = [
    query.trim()
      ? { label: `Busca "${query.trim()}"`, onRemove: () => onQueryChange("") }
      : null,
    activeFilter !== "active"
      ? {
          label: `Estado: ${activeFilterLabels[activeFilter] ?? activeFilter}`,
          onRemove: () => onActiveFilterChange("active"),
        }
      : null,
    includeArchived
      ? { label: "Incluye archivados", onRemove: () => onIncludeArchivedChange(false) }
      : null,
  ].filter(Boolean) as OpsFilterChip[];

  const searchField = (
    <OpsSearchInput
      value={query}
      onChange={onQueryChange}
      placeholder="Buscar por nombre, email, teléfono o notas"
    />
  );

  const activeField = (
    <div className="space-y-2 md:w-56 md:space-y-0">
      <Label className="md:hidden">Estado</Label>
      <Select value={activeFilter} onValueChange={onActiveFilterChange}>
        <SelectTrigger className={opsFilterControlClass}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="inactive">Inactivos</SelectItem>
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

  return (
    <div className="space-y-3">
      <div className="space-y-3 md:hidden">
        <div className="flex gap-2">
          {searchField}
          <OpsFilterSheet
            activeCount={chips.length}
            description="Filtra por estado, archivo o contacto."
            onClear={onClear}
          >
            {activeField}
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
          {activeField}
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

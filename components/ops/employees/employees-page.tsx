"use client";

import { UsersRound } from "lucide-react";

import { EmployeeCard } from "@/components/ops/employees/employee-card";
import { EmployeeFilters } from "@/components/ops/employees/employee-filters";
import { EmployeesHeader } from "@/components/ops/employees/employees-header";
import { EmployeesTable } from "@/components/ops/employees/employees-table";
import {
  countEmployeesByState,
  filterEmployeesByState,
  toEmployeeStateFilter,
} from "@/components/ops/employees/employees-table-model";
import { useEmployeeMutations } from "@/components/ops/hooks/useEmployeeMutations";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import {
  OpsEmptyState,
  OpsRecordList,
  OpsRecordSkeleton,
  useOpsFlushableDebouncedValue,
  useOpsPersistedState,
} from "@/components/ops/shared";

type EmployeeFilterState = {
  query: string;
  activeFilter: string;
  includeArchived: boolean;
};

const defaultEmployeeFilters: EmployeeFilterState = {
  query: "",
  activeFilter: "active",
  includeArchived: false,
};

// Empleados (feature 30, diseño "Empleados Bambu 1a"): tabla con selección en
// escritorio y tarjetas en el celular. El container query elige según el ancho
// del panel, que la barra lateral angosta.
export const EmployeesPage = () => {
  const [filterState, setFilterState] = useOpsPersistedState(
    "bambu:ops:employees:filters",
    defaultEmployeeFilters
  );
  const [debouncedQuery, flushQuery] = useOpsFlushableDebouncedValue(
    filterState.query,
    // Vaciar el buscador vuelve al listado completo, que ya está en caché: no
    // tiene sentido esperar el debounce.
    filterState.query.trim() ? 500 : 0
  );

  // Activas e inactivas llegan juntas para contar cada pestaña del estado.
  const { employees, isFetching, isLoading, refetch } = useEmployees({
    query: debouncedQuery || undefined,
    includeArchived: filterState.includeArchived,
  });
  const { archiveEmployeeAsync } = useEmployeeMutations();
  const state = toEmployeeStateFilter(filterState.activeFilter);
  const counts = countEmployeesByState(employees);
  const visible = filterEmployeesByState(employees, state);
  const updateFilters = (values: Partial<EmployeeFilterState>) => {
    setFilterState((current) => ({ ...current, ...values }));
  };
  const clearFilters = () => setFilterState(defaultEmployeeFilters);

  return (
    <div className="@container/employees container flex w-full flex-col gap-4 pb-8">
      <EmployeesHeader activeCount={counts.active} />
      <div className="hidden @4xl/employees:block">
        <EmployeesTable
          employees={visible}
          isLoading={isLoading}
          onClearFilters={clearFilters}
          toolbar={{
            counts,
            includeArchived: filterState.includeArchived,
            isFetching,
            query: filterState.query,
            state,
            onIncludeArchivedChange: (includeArchived) => updateFilters({ includeArchived }),
            onQueryChange: (query) => updateFilters({ query }),
            onQuerySubmit: flushQuery,
            onRefresh: () => void refetch(),
            onStateChange: (activeFilter) => updateFilters({ activeFilter }),
          }}
        />
      </div>
      <div className="flex flex-col gap-4 @4xl/employees:hidden">
        <EmployeeFilters
          query={filterState.query}
          activeFilter={state}
          includeArchived={filterState.includeArchived}
          isRefreshing={isFetching}
          isSearching={isFetching}
          onQueryChange={(query) => updateFilters({ query })}
          onQuerySubmit={flushQuery}
          onRefresh={refetch}
          onActiveFilterChange={(activeFilter) => updateFilters({ activeFilter })}
          onIncludeArchivedChange={(includeArchived) => updateFilters({ includeArchived })}
          onClear={clearFilters}
        />
        {isLoading ? (
          <OpsRecordSkeleton count={6} />
        ) : visible.length ? (
          <OpsRecordList>
            {visible.map((employee) => (
              <EmployeeCard
                key={employee.id}
                employee={employee}
                onArchive={async (employeeId) => {
                  await archiveEmployeeAsync(employeeId);
                }}
              />
            ))}
          </OpsRecordList>
        ) : (
          <OpsEmptyState
            icon={UsersRound}
            title="No hay empleados para este filtro"
            description="Crea un empleado nuevo o limpia los filtros para revisar activos, inactivos y archivados."
          />
        )}
      </div>
    </div>
  );
};

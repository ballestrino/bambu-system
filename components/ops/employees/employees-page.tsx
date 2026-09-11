"use client";

import { UsersRound } from "lucide-react";

import { EmployeeCard } from "@/components/ops/employees/employee-card";
import { EmployeeFilters } from "@/components/ops/employees/employee-filters";
import { EmployeesHeader } from "@/components/ops/employees/employees-header";
import { useEmployeeMutations } from "@/components/ops/hooks/useEmployeeMutations";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import {
  OpsEmptyState,
  OpsPageShell,
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

  const filters = {
    query: debouncedQuery || undefined,
    isActive:
      filterState.activeFilter === "all"
        ? undefined
        : filterState.activeFilter === "active",
    includeArchived: filterState.includeArchived,
  };

  const { employees, isFetching, isLoading, refetch } = useEmployees(filters);
  const { archiveEmployeeAsync } = useEmployeeMutations();
  const updateFilters = (values: Partial<EmployeeFilterState>) => {
    setFilterState((current) => ({ ...current, ...values }));
  };

  return (
    <OpsPageShell>
      <EmployeesHeader count={employees.length} />
      <EmployeeFilters
        query={filterState.query}
        activeFilter={filterState.activeFilter}
        includeArchived={filterState.includeArchived}
        isRefreshing={isFetching}
        isSearching={isFetching}
        onQueryChange={(query) => updateFilters({ query })}
        onQuerySubmit={flushQuery}
        onRefresh={refetch}
        onActiveFilterChange={(activeFilter) => updateFilters({ activeFilter })}
        onIncludeArchivedChange={(includeArchived) =>
          updateFilters({ includeArchived })
        }
        onClear={() => setFilterState(defaultEmployeeFilters)}
      />
      {isLoading ? (
        <OpsRecordSkeleton count={6} />
      ) : employees.length ? (
        <OpsRecordList>
          {employees.map((employee) => (
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
    </OpsPageShell>
  );
};

"use client";

import { useDeferredValue, useState } from "react";

import { EmployeeCard } from "@/components/ops/employees/employee-card";
import { EmployeeFilters } from "@/components/ops/employees/employee-filters";
import { EmployeesHeader } from "@/components/ops/employees/employees-header";
import { useEmployeeMutations } from "@/components/ops/hooks/useEmployeeMutations";
import { useEmployees } from "@/components/ops/hooks/useEmployees";
import { Card, CardContent } from "@/components/ui/card";

export const EmployeesPage = () => {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("active");
  const [includeArchived, setIncludeArchived] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const filters = {
    query: deferredQuery || undefined,
    isActive:
      activeFilter === "all" ? undefined : activeFilter === "active",
    includeArchived,
  };

  const { employees, isLoading } = useEmployees(filters);
  const { archiveEmployeeAsync } = useEmployeeMutations();

  return (
    <div className="container flex w-full flex-col gap-6">
      <EmployeesHeader count={employees.length} />
      <EmployeeFilters
        query={query}
        activeFilter={activeFilter}
        includeArchived={includeArchived}
        onQueryChange={setQuery}
        onActiveFilterChange={setActiveFilter}
        onIncludeArchivedChange={setIncludeArchived}
      />
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="h-44 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : employees.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {employees.map((employee) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              onArchive={async (employeeId) => {
                await archiveEmployeeAsync(employeeId);
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
            <h2 className="text-lg font-semibold">No hay empleados para este filtro</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Creá un empleado o ajustá la búsqueda para revisar activos, inactivos o archivados.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

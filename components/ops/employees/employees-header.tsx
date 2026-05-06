"use client";

import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";

export const EmployeesHeader = ({ count }: { count: number }) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
      <p className="text-muted-foreground">
        {count} persona(s) listas para asignar a trabajos.
      </p>
    </div>
    <EmployeeFormDialog />
  </div>
);

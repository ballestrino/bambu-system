"use client";

import Link from "next/link";
import { Gift } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";
import { Button } from "@/components/ui/button";

export const EmployeesHeader = ({ count }: { count: number }) => (
  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight">Empleados</h1>
      <p className="text-muted-foreground">
        {count} persona(s) listas para asignar a trabajos.
      </p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" className={dashboardSecondaryActionClass}>
        <Link href="/dashboard/employees/accruals">
          <Gift className="h-4 w-4" />
          Aguinaldo y salario vacacional
        </Link>
      </Button>
      <EmployeeFormDialog />
    </div>
  </div>
);

"use client";

import { AlertCircle } from "lucide-react";

import { EmployeeAssignmentsPanel } from "@/components/ops/employees/employee-assignments-panel";
import { EmployeeSummaryCard } from "@/components/ops/employees/employee-summary-card";
import { useEmployee } from "@/components/ops/hooks/useEmployee";
import { useJobEmployeeAssignments } from "@/components/ops/hooks/useJobEmployeeAssignments";
import { Card, CardContent } from "@/components/ui/card";

export const EmployeeDetailPage = ({ employeeId }: { employeeId: string }) => {
  const { employee, isLoading, error } = useEmployee(employeeId);
  const { assignments } = useJobEmployeeAssignments(
    { employeeId, includeArchived: true },
    employeeId
  );

  if (isLoading) {
    return <div className="container w-full animate-pulse rounded-lg bg-muted/40 p-20" />;
  }

  if (error || !employee) {
    return (
      <Card className="container w-full border-dashed">
        <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">No pudimos cargar el empleado</h1>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container flex w-full flex-col gap-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
        <p className="text-muted-foreground">Ficha operativa y trabajos vinculados.</p>
      </div>
      <EmployeeSummaryCard employee={employee} />
      <EmployeeAssignmentsPanel assignments={assignments} />
    </div>
  );
};

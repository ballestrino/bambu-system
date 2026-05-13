"use client";

import Link from "next/link";
import { AlertCircle, ChevronLeft } from "lucide-react";

import { EmployeeAssignmentsPanel } from "@/components/ops/employees/employee-assignments-panel";
import { EmployeeSummaryCard } from "@/components/ops/employees/employee-summary-card";
import { EmployeeVisitsPanel } from "@/components/ops/employees/employee-visits-panel";
import { EmployeePayrollPanel } from "@/components/ops/payroll/employee-payroll-panel";
import { useEmployee } from "@/components/ops/hooks/useEmployee";
import { useJobEmployeeAssignments } from "@/components/ops/hooks/useJobEmployeeAssignments";
import { Button } from "@/components/ui/button";
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
        <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit text-[#244C2D] hover:bg-[#EAF5EC] hover:text-[#244C2D]">
          <Link href="/dashboard/employees">
            <ChevronLeft className="h-4 w-4" />
            Empleados
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
        <p className="text-muted-foreground">Ficha operativa, visitas y horas para pago.</p>
      </div>
      <EmployeeSummaryCard employee={employee} />
      <EmployeeVisitsPanel employeeId={employeeId} hourlyRate={employee.hourlyRate} />
      <EmployeePayrollPanel employee={employee} />
      <EmployeeAssignmentsPanel assignments={assignments} />
    </div>
  );
};

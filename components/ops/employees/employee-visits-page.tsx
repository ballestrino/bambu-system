"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

import { EmployeeVisitsPanel } from "@/components/ops/employees/employee-visits-panel";
import { useEmployee } from "@/components/ops/hooks/useEmployee";
import { OpsPageHeader, OpsPageShell } from "@/components/ops/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const EmployeeVisitsPage = ({ employeeId }: { employeeId: string }) => {
  const { employee, isLoading, error } = useEmployee(employeeId);

  if (isLoading) {
    return <div className="container w-full animate-pulse rounded-lg bg-muted/40 p-20" />;
  }

  if (error || !employee) {
    return (
      <Card className="container w-full border-dashed">
        <CardContent className="flex min-h-52 flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <h1 className="text-xl font-semibold">No pudimos cargar las visitas</h1>
        </CardContent>
      </Card>
    );
  }

  return (
    <OpsPageShell>
      <OpsPageHeader
        eyebrow="Operaciones"
        title={`Visitas de ${employee.name}`}
        description="Revisa el historial de servicios, horas reales y pago estimado por periodo."
        actions={
          <Button asChild size="sm" variant="outline">
            <Link href={`/dashboard/employees/${employeeId}`}>Volver al empleado</Link>
          </Button>
        }
      />

      <EmployeeVisitsPanel employeeId={employeeId} hourlyRate={employee.hourlyRate} />
    </OpsPageShell>
  );
};

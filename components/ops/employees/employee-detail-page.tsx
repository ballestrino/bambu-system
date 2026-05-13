"use client";

import Link from "next/link";
import {
  AlertCircle,
  BadgeDollarSign,
  BriefcaseBusiness,
  Clock3,
  UserRound,
  WalletCards,
} from "lucide-react";

import { EmployeeAssignmentsPanel } from "@/components/ops/employees/employee-assignments-panel";
import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";
import { formatMoney, getHourlyRateNumber } from "@/components/ops/employees/employee-payroll";
import { EmployeeSummaryCard } from "@/components/ops/employees/employee-summary-card";
import { EmployeeVisitsPanel } from "@/components/ops/employees/employee-visits-panel";
import { EmployeePayrollPanel } from "@/components/ops/payroll/employee-payroll-panel";
import { PayrollDialog } from "@/components/ops/payroll/payroll-dialog";
import { useEmployee } from "@/components/ops/hooks/useEmployee";
import { useJobEmployeeAssignments } from "@/components/ops/hooks/useJobEmployeeAssignments";
import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { OpsDetailHero, OpsDetailStat, OpsNextAction, OpsPageShell } from "@/components/ops/shared";
import { Badge } from "@/components/ui/badge";
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

  const activeAssignments = assignments.filter((assignment) => !assignment.archivedAt);
  const hourlyRate = getHourlyRateNumber(employee.hourlyRate);

  return (
    <OpsPageShell>
      <OpsDetailHero
        actions={<EmployeeFormDialog employee={employee} />}
        backHref="/dashboard/employees"
        backLabel="Empleados"
        description="Ficha operativa para revisar contacto, visitas, pagos y trabajos vinculados."
        icon={UserRound}
        meta={<Badge variant={employee.isActive ? "default" : "secondary"}>{employee.isActive ? "Activo" : "Inactivo"}</Badge>}
        title={employee.name}
      >
        <OpsDetailStat icon={BriefcaseBusiness} label="Trabajos activos" value={activeAssignments.length} helper={`${assignments.length} asignacion(es) totales`} />
        <OpsDetailStat icon={BadgeDollarSign} label="Tarifa" value={hourlyRate === null ? "Pendiente" : `${formatMoney(hourlyRate)} / h`} helper="base para pagos" />
        <OpsDetailStat icon={Clock3} label="Visitas" value="Mes actual" helper="filtradas por periodo" />
        <OpsDetailStat icon={WalletCards} label="Pagos" value="Control" helper="saldo y registros" />
      </OpsDetailHero>

      {hourlyRate === null ? (
        <OpsNextAction
          action={<EmployeeFormDialog employee={employee} />}
          description="Sin tarifa horaria el pago estimado queda incompleto. Conviene cargarla antes de revisar liquidaciones."
          icon={BadgeDollarSign}
          title="Configurar tarifa horaria"
          tone="warning"
        />
      ) : !activeAssignments.length ? (
        <OpsNextAction
          action={
            <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
              <Link href="/dashboard/jobs">Ver trabajos</Link>
            </Button>
          }
          description="La empleada ya tiene datos base. Ahora asignala desde el trabajo donde participa."
          icon={BriefcaseBusiness}
          title="Asignar a un trabajo"
        />
      ) : (
        <OpsNextAction
          action={<PayrollDialog employeeId={employee.id} employees={[employee]} />}
          description="Con trabajos y tarifa configurados, el flujo natural es revisar visitas realizadas y registrar pagos."
          icon={WalletCards}
          title="Revisar pago del periodo"
          tone="money"
        />
      )}

      <EmployeeSummaryCard employee={employee} />
      <EmployeeVisitsPanel employeeId={employeeId} hourlyRate={employee.hourlyRate} />
      <EmployeePayrollPanel employee={employee} />
      <EmployeeAssignmentsPanel assignments={assignments} />
    </OpsPageShell>
  );
};

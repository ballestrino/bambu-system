"use client";

import Link from "next/link";
import { CircleDollarSign, Mail, Phone, UserRound } from "lucide-react";

import { dashboardSecondaryActionClass } from "@/components/dashboard/dashboard-styles";
import { formatMoney, getHourlyRateNumber } from "@/components/ops/employees/employee-payroll";
import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";
import type { OpsEmployee } from "@/components/ops/types";
import { OpsRecordItem, opsToneClasses } from "@/components/ops/shared";
import DeleteDialog from "@/components/ui/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const EmployeeCard = ({
  employee,
  onArchive,
}: {
  employee: OpsEmployee;
  onArchive: (employeeId: string) => Promise<void>;
}) => {
  const contact = employee.phone || employee.email || "Sin contacto cargado";
  const hourlyRate = getHourlyRateNumber(employee.hourlyRate);

  return (
    <OpsRecordItem
      leading={
        <div className="hidden rounded-md border border-[#53985E]/20 bg-[#EAF5EC] p-2 text-[#244C2D] md:flex">
          <UserRound className="h-5 w-5" />
        </div>
      }
      title={employee.name}
      subtitle={contact}
      status={
        <Badge
          variant="outline"
          className={cn(
            "border",
            employee.isActive ? opsToneClasses.active : opsToneClasses.neutral
          )}
        >
          {employee.isActive ? "Activo" : "Inactivo"}
        </Badge>
      }
      description={employee.notes}
      meta={
        <>
          {employee.phone ? (
            <span className="inline-flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {employee.phone}
            </span>
          ) : null}
          {employee.email ? (
            <span className="inline-flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {employee.email}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1">
            <CircleDollarSign className="h-3.5 w-3.5" />
            {hourlyRate === null ? "Sin tarifa" : `${formatMoney(hourlyRate)}/h`}
          </span>
        </>
      }
      actions={
        <>
          <Button asChild size="sm" variant="outline" className={dashboardSecondaryActionClass}>
            <Link href={`/dashboard/employees/${employee.id}`}>Detalle</Link>
          </Button>
          <EmployeeFormDialog employee={employee} />
          <DeleteDialog
            title="Archivar empleado"
            description="El empleado dejará de aparecer como opción normal para nuevas asignaciones."
            deleteButtonText="Archivar"
            deleteButtonVariant="default"
            onConfirm={async () => {
              await onArchive(employee.id);
            }}
            trigger={
              <Button variant="outline" size="sm">
                Archivar
              </Button>
            }
          />
        </>
      }
    />
  );
};

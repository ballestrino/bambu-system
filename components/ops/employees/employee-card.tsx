"use client";

import Link from "next/link";

import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";
import type { OpsEmployee } from "@/components/ops/types";
import DeleteDialog from "@/components/ui/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EmployeeCard = ({
  employee,
  onArchive,
}: {
  employee: OpsEmployee;
  onArchive: (employeeId: string) => Promise<void>;
}) => (
  <Card className="h-full border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
    <CardHeader className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-lg">{employee.name}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {employee.phone || employee.email || "Sin contacto cargado"}
          </p>
        </div>
        <Badge variant={employee.isActive ? "default" : "secondary"}>
          {employee.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>
      {employee.notes ? (
        <p className="line-clamp-2 text-sm text-muted-foreground">{employee.notes}</p>
      ) : null}
    </CardHeader>
    <CardContent className="flex flex-wrap gap-2">
      <Button asChild size="sm">
        <Link href={`/dashboard/employees/${employee.id}`}>Ver detalle</Link>
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
    </CardContent>
  </Card>
);

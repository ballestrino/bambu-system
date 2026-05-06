"use client";

import { Mail, Phone, UserRound } from "lucide-react";

import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";
import type { OpsEmployeeDetail } from "@/components/ops/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const EmployeeSummaryCard = ({ employee }: { employee: OpsEmployeeDetail }) => (
  <Card className="border-0 bg-white/80 shadow-sm ring-1 ring-black/5">
    <CardHeader className="flex flex-row items-start justify-between gap-4">
      <div className="space-y-2">
        <CardTitle className="flex items-center gap-2">
          <UserRound className="h-5 w-5 text-emerald-700" />
          {employee.name}
        </CardTitle>
        <Badge variant={employee.isActive ? "default" : "secondary"}>
          {employee.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </div>
      <EmployeeFormDialog employee={employee} />
    </CardHeader>
    <CardContent className="grid gap-4 md:grid-cols-3">
      <div className="space-y-1 text-sm">
        <p className="flex items-center gap-2 font-medium"><Mail className="h-4 w-4" />Email</p>
        <p className="text-muted-foreground">{employee.email || "Sin email"}</p>
      </div>
      <div className="space-y-1 text-sm">
        <p className="flex items-center gap-2 font-medium"><Phone className="h-4 w-4" />Teléfono</p>
        <p className="text-muted-foreground">{employee.phone || "Sin teléfono"}</p>
      </div>
      <div className="space-y-1 text-sm">
        <p className="font-medium">Notas</p>
        <p className="text-muted-foreground">{employee.notes || "Sin notas"}</p>
      </div>
    </CardContent>
  </Card>
);

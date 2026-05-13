"use client";

import { BadgeDollarSign, Mail, Phone, StickyNote } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatMoney, getHourlyRateNumber } from "@/components/ops/employees/employee-payroll";
import type { OpsEmployeeDetail } from "@/components/ops/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EmployeeSummaryItem = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => (
  <div className="rounded-xl border border-[#53985E]/10 bg-[#F8FBF8] p-3 text-sm dark:bg-[#132016]">
    <p className="flex items-center gap-2 font-medium text-[#244C2D] dark:text-[#A7D8AE]">
      <Icon className="h-4 w-4" />
      {label}
    </p>
    <p className="mt-2 break-words text-muted-foreground">{value}</p>
  </div>
);

export const EmployeeSummaryCard = ({ employee }: { employee: OpsEmployeeDetail }) => {
  const hourlyRate = getHourlyRateNumber(employee.hourlyRate);

  return (
    <Card className="rounded-2xl border-0 bg-white/90 shadow-sm ring-1 ring-black/5 dark:bg-background/70">
      <CardHeader>
        <div className="space-y-2">
          <CardTitle>Contacto y tarifa</CardTitle>
          <p className="text-sm text-muted-foreground">
            Datos base que impactan coordinacion, agenda y liquidacion.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-4">
        <EmployeeSummaryItem icon={Mail} label="Email" value={employee.email || "Sin email"} />
        <EmployeeSummaryItem icon={Phone} label="Telefono" value={employee.phone || "Sin telefono"} />
        <EmployeeSummaryItem icon={BadgeDollarSign} label="Tarifa" value={hourlyRate === null ? "Sin tarifa" : `${formatMoney(hourlyRate)} / h`} />
        <EmployeeSummaryItem icon={StickyNote} label="Notas" value={employee.notes || "Sin notas"} />
      </CardContent>
    </Card>
  );
};

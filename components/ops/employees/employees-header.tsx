"use client";

import Link from "next/link";
import { CalendarRange, Gift } from "lucide-react";

import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";

const outlineLink =
  "inline-flex h-10 items-center gap-[7px] rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-[13.5px] font-semibold whitespace-nowrap text-ops-text hover:bg-ops-surface-muted hover:no-underline";

// Encabezado de Empleados (1a): título, cuántas están activas y accesos.
export const EmployeesHeader = ({ activeCount }: { activeCount: number }) => (
  <div className="flex flex-none flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-4">
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-ops-bamboo-strong">Operaciones</span>
      <h1 className="text-[28px] leading-[1.15] font-semibold tracking-tight text-ops-text">Empleados</h1>
      <span className="text-[13.5px] text-ops-text-muted">
        {activeCount} persona(s) listas para asignar a trabajos.
      </span>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      <Link className={outlineLink} href="/dashboard/calendar">
        <CalendarRange className="size-4" />
        Cronograma semanal
      </Link>
      <Link className={outlineLink} href="/dashboard/employees/accruals">
        <Gift className="size-4" />
        Aguinaldo y salario vacacional
      </Link>
      <EmployeeFormDialog triggerClassName="h-10 rounded-[10px] px-4 text-[13.5px] font-semibold" />
    </div>
  </div>
);

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, CalendarDays, ChartColumn, Pencil, UserCheck, UserX } from "lucide-react";

import { EmployeeCheckbox } from "@/components/ops/employees/employee-checkbox";
import { EmployeeFormDialog } from "@/components/ops/employees/employee-form-dialog";
import {
  employeeInitials,
  employeeStatus,
  formatEmployeeRate,
} from "@/components/ops/employees/employees-table-model";
import { OpsActionMenu, type OpsActionMenuItem } from "@/components/ops/shared";
import type { OpsEmployee } from "@/components/ops/types";
import { cn } from "@/lib/utils";

export const employeeTableGrid =
  "grid grid-cols-[52px_minmax(0,2.2fr)_minmax(0,1.3fr)_minmax(0,1.8fr)_120px_110px_132px] items-center pr-2";

const statusClasses = {
  Activo: { pill: "border-ops-bamboo/30 bg-ops-bamboo-soft text-ops-bamboo-strong", dot: "bg-ops-bamboo" },
  Inactivo: { pill: "border-ops-border bg-ops-surface-muted text-ops-text/80", dot: "bg-[#9AA59D]" },
  Archivado: { pill: "border-ops-border bg-ops-surface-muted text-ops-text-muted", dot: "bg-[#9AA59D]" },
} as const;

const muted = "text-[#9AA59D] dark:text-ops-text-muted/70";

export const EmployeeTableRow = ({
  employee,
  selected,
  onArchive,
  onSetActive,
  onToggle,
}: {
  employee: OpsEmployee;
  selected: boolean;
  onArchive: (employeeIds: string[]) => void;
  onSetActive: (employeeIds: string[], isActive: boolean) => void;
  onToggle: (employeeId: string) => void;
}) => {
  const router = useRouter();
  const status = employeeStatus(employee);
  const rate = formatEmployeeRate(employee.hourlyRate);
  const detailHref = `/dashboard/employees/${employee.id}`;

  const menuItems: OpsActionMenuItem[] = [
    { label: "Ver visitas", icon: CalendarDays, onSelect: () => router.push(`${detailHref}/visits`) },
    { label: "Resumen mensual", icon: ChartColumn, onSelect: () => router.push(`${detailHref}/summary`) },
    ...(employee.archivedAt
      ? []
      : [
          {
            label: employee.isActive ? "Desactivar" : "Activar",
            icon: employee.isActive ? UserX : UserCheck,
            onSelect: () => onSetActive([employee.id], !employee.isActive),
            separated: true,
          },
          {
            label: "Archivar",
            icon: Archive,
            onSelect: () => onArchive([employee.id]),
            variant: "destructive" as const,
          },
        ]),
  ];

  return (
    <div
      className={cn(
        employeeTableGrid,
        "min-h-14 cursor-pointer border-b border-ops-surface-muted transition-colors",
        selected ? "bg-ops-bamboo-soft/70 hover:bg-ops-bamboo-soft" : "hover:bg-ops-surface-muted/60",
        employee.archivedAt && "opacity-65"
      )}
      onClick={() => onToggle(employee.id)}
    >
      <span className="flex justify-center">
        <EmployeeCheckbox
          checked={selected}
          label={`Seleccionar a ${employee.name}`}
          onCheckedChange={() => onToggle(employee.id)}
        />
      </span>
      <div className="flex min-w-0 items-center gap-2.5 py-2">
        <span className="flex size-8 flex-none items-center justify-center rounded-full border border-ops-bamboo/20 bg-ops-bamboo-soft text-xs font-semibold text-ops-bamboo-strong">
          {employeeInitials(employee.name)}
        </span>
        <div className="flex min-w-0 flex-col gap-px">
          <span className="truncate text-sm font-semibold text-ops-text">{employee.name}</span>
          <span className="truncate text-xs text-ops-text-muted">{employee.notes || "—"}</span>
        </div>
      </div>
      <span className={cn("text-[13px] whitespace-nowrap tabular-nums", employee.phone ? "text-ops-text" : muted)}>
        {employee.phone || "Sin teléfono"}
      </span>
      <span className={cn("truncate pr-3 text-[13px]", employee.email ? "text-ops-text" : muted)}>
        {employee.email || "Sin email"}
      </span>
      <span className={cn("pr-4 text-right text-[13px] font-medium whitespace-nowrap tabular-nums", rate ? "text-ops-text" : muted)}>
        {rate ?? "Sin tarifa"}
      </span>
      <span>
        <span className={cn("inline-flex h-6 items-center gap-1.5 rounded-full border px-[9px] text-xs font-semibold whitespace-nowrap", statusClasses[status].pill)}>
          <span className={cn("size-1.5 rounded-full", statusClasses[status].dot)} />
          {status}
        </span>
      </span>
      {/* Los clics de los diálogos y menús también burbujean por React: se cortan acá. */}
      <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
        <Link
          className="inline-flex h-[30px] items-center rounded-lg border border-ops-border bg-ops-surface px-2.5 text-[12.5px] font-semibold whitespace-nowrap text-ops-text hover:bg-ops-surface-muted hover:no-underline"
          href={detailHref}
        >
          Detalle
        </Link>
        <EmployeeFormDialog
          employee={employee}
          trigger={
            <button
              aria-label={`Editar a ${employee.name}`}
              className="flex size-[30px] items-center justify-center rounded-lg text-ops-text/75 hover:bg-ops-surface-muted"
              type="button"
            >
              <Pencil className="size-[15px]" />
            </button>
          }
        />
        <OpsActionMenu items={menuItems} label={`Más acciones de ${employee.name}`} />
      </div>
    </div>
  );
};

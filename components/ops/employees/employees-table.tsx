"use client";

import { useState, type ComponentProps } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, UsersRound } from "lucide-react";

import { EmployeeCheckbox } from "@/components/ops/employees/employee-checkbox";
import { EmployeeTableRow, employeeTableGrid } from "@/components/ops/employees/employee-table-row";
import { EmployeesArchiveDialog, EmployeesBulkBar } from "@/components/ops/employees/employees-bulk-bar";
import {
  buildEmployeesCsv,
  nextEmployeeSort,
  sortEmployeeRows,
  type EmployeeSort,
  type EmployeeSortKey,
} from "@/components/ops/employees/employees-table-model";
import { EmployeesTableToolbar } from "@/components/ops/employees/employees-table-toolbar";
import { useEmployeeBulkMutations } from "@/components/ops/hooks/useEmployeeBulkMutations";
import { downloadBlob } from "@/components/ops/shared/ops-download";
import type { OpsEmployee } from "@/components/ops/types";
import { Skeleton } from "@/components/ui/skeleton";

const SortHeader = ({ label, sortKey, sort, onSort, className }: {
  className?: string;
  label: string;
  onSort: (key: EmployeeSortKey) => void;
  sort: EmployeeSort;
  sortKey: EmployeeSortKey;
}) => {
  const Icon = sort.key !== sortKey ? ChevronsUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <button className={`flex items-center gap-1 select-none ${className ?? ""}`} onClick={() => onSort(sortKey)} type="button">
      {label}
      <Icon className="size-[13px]" />
    </button>
  );
};

// Tabla de escritorio de empleados (diseño "Empleados Bambu 1a", feature 30).
export const EmployeesTable = ({
  employees,
  isLoading,
  onClearFilters,
  toolbar,
}: {
  employees: OpsEmployee[];
  isLoading: boolean;
  onClearFilters: () => void;
  toolbar: ComponentProps<typeof EmployeesTableToolbar>;
}) => {
  const [sort, setSort] = useState<EmployeeSort>({ key: "name", dir: 1 });
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  // Los nombres se guardan al abrir: al archivar, las filas pueden irse del filtro.
  const [archive, setArchive] = useState({ ids: [] as string[], names: [] as string[], open: false });
  const { archiveEmployeesAsync, isPending, setEmployeesActiveAsync } = useEmployeeBulkMutations();

  const rows = sortEmployeeRows(employees, sort);
  // Solo cuentan las marcadas que el filtro actual deja ver.
  const selectedRows = rows.filter((employee) => selected[employee.id]);
  const selectedIds = selectedRows.map((employee) => employee.id);
  const allChecked = rows.length > 0 && selectedIds.length === rows.length;

  const toggle = (employeeId: string) =>
    setSelected((current) => ({ ...current, [employeeId]: !current[employeeId] }));
  const clearSelection = () => setSelected({});
  const setActive = (employeeIds: string[], isActive: boolean) => {
    clearSelection();
    void setEmployeesActiveAsync({ employeeIds, isActive }).catch(() => undefined);
  };
  const openArchive = (employeeIds: string[]) =>
    setArchive({
      ids: employeeIds,
      names: rows.filter((employee) => employeeIds.includes(employee.id)).map((employee) => employee.name),
      open: true,
    });
  const confirmArchive = () => {
    void archiveEmployeesAsync(archive.ids).catch(() => undefined);
    setArchive((current) => ({ ...current, open: false }));
    clearSelection();
  };
  const exportCsv = () =>
    downloadBlob(
      `empleados-${new Date().toISOString().slice(0, 10)}.csv`,
      // El BOM hace que Excel lea bien los acentos.
      new Blob(["﻿" + buildEmployeesCsv(selectedRows)], { type: "text/csv;charset=utf-8" })
    );

  return (
    <section className="relative flex h-[max(520px,calc(100dvh-15rem))] flex-col overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
      <EmployeesTableToolbar {...toolbar} />
      <div className={`${employeeTableGrid} h-10 flex-none border-b border-ops-border bg-ops-surface-muted/60 text-xs font-semibold text-ops-text/80`}>
        <span className="flex justify-center">
          <EmployeeCheckbox
            checked={allChecked ? true : selectedIds.length ? "indeterminate" : false}
            label="Seleccionar todos"
            onCheckedChange={() =>
              setSelected(allChecked ? {} : Object.fromEntries(rows.map((employee) => [employee.id, true])))
            }
          />
        </span>
        <SortHeader label="Nombre" onSort={(key) => setSort(nextEmployeeSort(sort, key))} sort={sort} sortKey="name" />
        <span>Teléfono</span>
        <span>Email</span>
        <SortHeader className="justify-end pr-4" label="Tarifa" onSort={(key) => setSort(nextEmployeeSort(sort, key))} sort={sort} sortKey="rate" />
        <span>Estado</span>
        <span />
      </div>
      <div className="min-h-0 flex-1 overflow-auto pb-[84px]">
        {isLoading ? (
          Array.from({ length: 6 }, (_, index) => (
            <div className="flex h-14 items-center gap-3 border-b border-ops-surface-muted px-4" key={index}>
              <Skeleton className="size-[18px] rounded-[5px]" />
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))
        ) : rows.length ? (
          rows.map((employee) => (
            <EmployeeTableRow
              employee={employee}
              key={employee.id}
              onArchive={openArchive}
              onSetActive={setActive}
              onToggle={toggle}
              selected={!!selected[employee.id]}
            />
          ))
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-[72px] text-center">
            <span className="flex size-12 items-center justify-center rounded-[14px] bg-ops-bamboo-soft text-ops-bamboo-strong">
              <UsersRound className="size-[22px]" />
            </span>
            <div className="flex flex-col gap-1">
              <span className="text-base font-semibold text-ops-text">No hay empleados para este filtro</span>
              <span className="text-[13.5px] text-ops-text-muted">
                Crea un empleado nuevo o limpia los filtros para revisar activos, inactivos y archivados.
              </span>
            </div>
            <button
              className="inline-flex h-10 items-center rounded-[10px] border border-ops-border px-4 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted"
              onClick={onClearFilters}
              type="button"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>
      {selectedIds.length ? (
        <EmployeesBulkBar
          count={selectedIds.length}
          disabled={isPending}
          onActivate={() => setActive(selectedIds, true)}
          onArchive={() => openArchive(selectedIds)}
          onClear={clearSelection}
          onDeactivate={() => setActive(selectedIds, false)}
          onExport={exportCsv}
        />
      ) : null}
      <EmployeesArchiveDialog
        names={archive.names}
        onConfirm={confirmArchive}
        onOpenChange={(open) => setArchive((current) => ({ ...current, open }))}
        open={archive.open}
      />
    </section>
  );
};

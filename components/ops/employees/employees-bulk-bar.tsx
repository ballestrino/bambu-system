"use client";

import type { ComponentType } from "react";
import { Archive, Download, UserCheck, UserX, X } from "lucide-react";

import { employeesCountLabel } from "@/components/ops/employees/employees-table-model";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const BarButton = ({
  danger,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  danger?: boolean;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) => (
  <button
    className={cn(
      "inline-flex h-9 items-center gap-[7px] rounded-[9px] px-3 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-50",
      danger && "text-red-300"
    )}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    <Icon className="size-[15px]" />
    {label}
  </button>
);

const Divider = () => <span className="h-[22px] w-px bg-white/20" />;

// Barra flotante de acciones en lote (1a); aparece con una o más filas marcadas.
export const EmployeesBulkBar = ({
  count,
  disabled,
  onActivate,
  onArchive,
  onClear,
  onDeactivate,
  onExport,
}: {
  count: number;
  disabled: boolean;
  onActivate: () => void;
  onArchive: () => void;
  onClear: () => void;
  onDeactivate: () => void;
  onExport: () => void;
}) => (
  <div className="absolute bottom-[18px] left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-[14px] bg-[#18251D] py-1.5 pr-1.5 pl-3.5 whitespace-nowrap text-white shadow-[0_18px_40px_rgb(24_37_29/0.28)] dark:border dark:border-ops-border dark:bg-ops-surface-muted">
    <span className="pr-2 text-[13.5px] font-semibold tabular-nums">
      {count} {count === 1 ? "seleccionado" : "seleccionados"}
    </span>
    <Divider />
    <BarButton disabled={disabled} icon={UserCheck} label="Activar" onClick={onActivate} />
    <BarButton disabled={disabled} icon={UserX} label="Desactivar" onClick={onDeactivate} />
    <BarButton icon={Download} label="Exportar CSV" onClick={onExport} />
    <BarButton danger disabled={disabled} icon={Archive} label="Archivar" onClick={onArchive} />
    <Divider />
    <button
      aria-label="Quitar selección"
      className="flex size-9 items-center justify-center rounded-[9px] hover:bg-white/10"
      onClick={onClear}
      type="button"
    >
      <X className="size-4" />
    </button>
  </div>
);

export const EmployeesArchiveDialog = ({
  names,
  open,
  onConfirm,
  onOpenChange,
}: {
  names: string[];
  open: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="flex w-[440px] max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-[var(--ops-radius-panel)] border-ops-border p-[22px] sm:max-w-[440px]">
      <div className="flex flex-col gap-1.5">
        <DialogTitle className="text-[17px] font-semibold text-ops-text">
          Archivar {employeesCountLabel(names.length)}
        </DialogTitle>
        <DialogDescription className="text-[13.5px] leading-normal text-ops-text/80">
          Dejarán de aparecer como opción normal para nuevas asignaciones.
        </DialogDescription>
      </div>
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {names.map((name, index) => (
          <span
            className="inline-flex h-[26px] items-center rounded-full border border-ops-border bg-ops-surface-muted px-2.5 text-[12.5px] font-medium text-ops-text"
            key={`${name}-${index}`}
          >
            {name}
          </span>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          className="inline-flex h-10 items-center rounded-[10px] border border-ops-border px-4 text-[13.5px] font-semibold text-ops-text hover:bg-ops-surface-muted"
          onClick={() => onOpenChange(false)}
          type="button"
        >
          Cancelar
        </button>
        <button
          className="inline-flex h-10 items-center gap-[7px] rounded-[10px] bg-ops-bamboo-strong px-4 text-[13.5px] font-semibold text-white hover:bg-ops-bamboo-strong/90 dark:text-ops-canvas"
          onClick={onConfirm}
          type="button"
        >
          <Archive className="size-[15px]" />
          Archivar
        </button>
      </div>
    </DialogContent>
  </Dialog>
);

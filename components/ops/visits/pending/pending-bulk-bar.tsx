"use client";

import type { ComponentType } from "react";
import { Ban, Check, SkipForward, Trash2, UserPlus, X } from "lucide-react";

import { describePendingSelection } from "@/lib/ops/pending-visits";
import { plural } from "@/lib/ops/visit-day";
import type { OpsOccurrence } from "@/components/ops/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PendingResolution } from "@/schemas/ops";
import { cn } from "@/lib/utils";

const barButton =
  "inline-flex h-9 shrink-0 items-center gap-[7px] rounded-[9px] px-3 text-[13px] font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45 dark:hover:bg-ops-surface";

const BarButton = ({
  className,
  disabled,
  icon: Icon,
  label,
  onClick,
  title,
}: {
  className?: string;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  title?: string;
}) => (
  <button aria-label={label} className={cn(barButton, className)} disabled={disabled} onClick={onClick} title={title ?? label} type="button">
    <Icon className="size-[15px]" />
    <span className="hidden @2xl/pending:inline">{label}</span>
  </button>
);

// Barra flotante de la seleccion (como la de Trabajos): asignar, registrar
// como hechas (solo si todas tienen equipo), omitir, cancelar y eliminar.
export const PendingBulkBar = ({
  employees,
  isBusy,
  onAssign,
  onClear,
  onResolve,
  visits,
}: {
  employees: { id: string; name: string }[];
  isBusy: boolean;
  onAssign: (employee: { id: string; name: string }) => void;
  onClear: () => void;
  onResolve: (action: Exclude<PendingResolution, "ASSIGN">) => void;
  visits: OpsOccurrence[];
}) => {
  if (!visits.length) return null;
  const selection = describePendingSelection(visits);
  const detail = [
    selection.jobs === 1 ? visits[0].job.name : `${selection.jobs} trabajos`,
    selection.unassigned ? `${selection.unassigned} sin equipo` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="pointer-events-none sticky bottom-[calc(var(--bottom-tabs-space,0px)+1.125rem+env(safe-area-inset-bottom))] z-20 flex h-0 items-end justify-center">
      <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-[14px] bg-[#18251D] py-1.5 pr-1.5 pl-3.5 text-white shadow-[0_18px_40px_rgb(24_37_29/0.28)] dark:border dark:border-ops-border dark:bg-ops-surface-muted dark:text-ops-text">
        <span aria-live="polite" className="flex min-w-0 flex-col pr-2 leading-tight">
          <span className="text-[13.5px] font-semibold whitespace-nowrap tabular-nums">
            {plural(selection.count, "seleccionada", "seleccionadas")}
          </span>
          <span className="truncate text-[11.5px] text-white/70 dark:text-ops-text-muted">{detail}</span>
        </span>
        <span className="h-[22px] w-px shrink-0 bg-white/20" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Asignar empleada" className={barButton} disabled={isBusy} title="Asignar empleada" type="button">
              <UserPlus className="size-[15px]" />
              <span className="hidden @2xl/pending:inline">Asignar</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="max-h-72 min-w-48 overflow-y-auto" side="top">
            <DropdownMenuLabel>Asignar a</DropdownMenuLabel>
            {employees.map((employee) => (
              <DropdownMenuItem key={employee.id} onSelect={() => onAssign(employee)}>
                {employee.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <BarButton
          disabled={isBusy || selection.unassigned > 0}
          icon={Check}
          label="Registrar como hechas"
          onClick={() => onResolve("DONE")}
          title={selection.unassigned ? "Primero asigná quién fue: hay visitas sin equipo" : "Registrar como hechas"}
        />
        <BarButton disabled={isBusy} icon={SkipForward} label="Marcar omitidas" onClick={() => onResolve("SKIPPED")} />
        <BarButton disabled={isBusy} icon={Ban} label="Cancelar" onClick={() => onResolve("CANCELED")} />
        <BarButton className="text-red-300 dark:text-red-400" disabled={isBusy} icon={Trash2} label="Eliminar" onClick={() => onResolve("DELETE")} />
        <span className="h-[22px] w-px shrink-0 bg-white/20" />
        <button aria-label="Quitar selección" className="flex size-9 shrink-0 items-center justify-center rounded-[9px] hover:bg-white/10" onClick={onClear} title="Quitar selección" type="button">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

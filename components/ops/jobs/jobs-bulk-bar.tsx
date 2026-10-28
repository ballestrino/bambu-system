"use client";

import type { ComponentType } from "react";
import { Archive, FileSpreadsheet, Pause, Play, X } from "lucide-react";

import { pluralJobs, type JobRow } from "@/components/ops/jobs/jobs-table-model";
import { jobsPrimaryButtonClass } from "@/components/ops/jobs/jobs-styles";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

const BarButton = ({
  className,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  className?: string;
  disabled?: boolean;
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
}) => (
  <button
    aria-label={label}
    className={cn(
      "inline-flex h-9 items-center gap-[7px] rounded-[9px] px-3 text-[13px] font-semibold hover:bg-white/10 disabled:opacity-50",
      className
    )}
    disabled={disabled}
    onClick={onClick}
    title={label}
    type="button"
  >
    <Icon className="size-[15px]" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

// Barra flotante de acciones en lote (1a). Queda pegada al pie de la pantalla
// mientras se recorre la tabla y no ocupa lugar en el flujo.
export const JobsBulkBar = ({
  count,
  isPending,
  onActivate,
  onArchive,
  onClear,
  onExport,
  onPause,
}: {
  count: number;
  isPending: boolean;
  onActivate: () => void;
  onArchive: () => void;
  onClear: () => void;
  onExport: () => void;
  onPause: () => void;
}) =>
  count ? (
    <div className="pointer-events-none sticky bottom-[calc(1.125rem+env(safe-area-inset-bottom))] z-20 flex h-0 justify-center">
      <div className="pointer-events-auto flex -translate-y-full items-center gap-1.5 rounded-[14px] bg-[#18251D] py-1.5 pr-1.5 pl-3.5 whitespace-nowrap text-white shadow-[0_18px_40px_rgb(24_37_29/0.28)] dark:border dark:border-ops-border dark:bg-ops-surface-muted">
        <span aria-live="polite" className="pr-2 text-[13.5px] font-semibold tabular-nums">
          {count} {count === 1 ? "seleccionado" : "seleccionados"}
        </span>
        <span className="h-[22px] w-px bg-white/20" />
        <BarButton disabled={isPending} icon={Play} label="Reactivar" onClick={onActivate} />
        <BarButton disabled={isPending} icon={Pause} label="Pausar" onClick={onPause} />
        <BarButton icon={FileSpreadsheet} label="Exportar Excel" onClick={onExport} />
        <BarButton className="text-red-300" disabled={isPending} icon={Archive} label="Archivar" onClick={onArchive} />
        <span className="h-[22px] w-px bg-white/20" />
        <button
          aria-label="Quitar selección"
          className="flex size-9 items-center justify-center rounded-[9px] hover:bg-white/10"
          onClick={onClear}
          title="Quitar selección"
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  ) : null;

export const JobsArchiveDialog = ({
  onCancel,
  onConfirm,
  rows,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  rows: JobRow[] | null;
}) => (
  <Dialog open={Boolean(rows?.length)} onOpenChange={(open) => !open && onCancel()}>
    <DialogContent className="flex max-w-[460px] flex-col gap-4 rounded-[14px] border-ops-border p-[22px] shadow-[var(--ops-shadow-elevated)]">
      <div className="flex flex-col gap-1.5">
        <DialogTitle className="text-[17px] font-semibold text-ops-text">
          Archivar {pluralJobs(rows?.length ?? 0)}
        </DialogTitle>
        <DialogDescription className="text-[13.5px] leading-normal text-ops-text-muted">
          Se ocultarán del listado principal pero conservarán su historial.
        </DialogDescription>
      </div>
      <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
        {rows?.map((row) => (
          <span
            className="inline-flex h-[26px] items-center rounded-full border border-ops-border bg-ops-surface-muted px-2.5 text-[12.5px] font-medium text-ops-text"
            key={row.job.id}
          >
            {row.job.name}
          </span>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button className="h-10 rounded-[10px] border-ops-border px-4 text-[13.5px] font-semibold shadow-none" onClick={onCancel} type="button" variant="outline">
          Cancelar
        </Button>
        <Button className={jobsPrimaryButtonClass} onClick={onConfirm} type="button">
          <Archive className="size-[15px]" />
          Archivar
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

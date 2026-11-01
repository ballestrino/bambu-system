"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";

import { formatMoney, getMonthLabel, getShortCfeLabel } from "@/components/billing/billing-format";
import { useDeleteDraftInvoice } from "@/components/billing/hooks/use-invoice-remove";
import { OpsFormBody, OpsFormDialogContent, OpsFormFooter, OpsFormHeader } from "@/components/ops/shared/ops-form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { DraftRow } from "@/lib/billing/billing-month-view";

// "Borrar" de una factura del borrador (47), con confirmación. Solo se ofrece
// en una fila DRAFT de un borrador abierto; el servidor lo vuelve a decidir.
// onDeleted: el editor lateral (49) sigue con la próxima factura.
export const BillingDeleteDraft = ({
  onDeleted,
  periodKey,
  row,
  variant,
}: {
  onDeleted?: () => void;
  periodKey: string;
  row: DraftRow;
  variant: "icon" | "sheet";
}) => {
  const [open, setOpen] = useState(false);
  const remove = useDeleteDraftInvoice(periodKey, row.id);

  const confirm = async () => {
    try {
      await remove.mutateAsync();
      onDeleted?.();
    } catch {
      // El aviso sale del hook y el mes se relee.
    } finally {
      setOpen(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          aria-label={`Borrar la factura de ${row.name}`}
          className="inline-flex size-8 flex-none items-center justify-center rounded-lg text-ops-text-muted hover:bg-red-50 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-ops-bamboo/40 focus-visible:outline-none dark:hover:bg-red-950/40 dark:hover:text-red-300"
          onClick={() => setOpen(true)}
          title="Borrar del borrador"
          type="button"
        >
          <Trash2 aria-hidden className="size-4" />
        </button>
      ) : (
        <button
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-red-700 active:bg-red-50 dark:text-red-300 dark:active:bg-red-950/40"
          onClick={() => setOpen(true)}
          type="button"
        >
          <Trash2 aria-hidden className="size-4" />
          Borrar del borrador
        </button>
      )}
      <Dialog onOpenChange={(next) => (remove.isPending ? undefined : setOpen(next))} open={open}>
        <OpsFormDialogContent size="sm">
          <OpsFormHeader>
            <DialogTitle>¿Borrar la factura de {row.name}?</DialogTitle>
            <DialogDescription>
              Sale del borrador de {getMonthLabel(periodKey)} y no se emite. No se puede deshacer: para volver a
              facturarla, agregala con Nueva factura.
            </DialogDescription>
          </OpsFormHeader>
          <OpsFormBody>
            <p className="flex justify-between gap-3 text-sm">
              <span className="truncate text-ops-text-muted">
                {getShortCfeLabel(row.cfeType)} · {row.lines[0]?.concepto ?? "Sin ítems"}
              </span>
              <strong className="tabular-nums">{formatMoney(row.taxed ? row.total : row.subtotal, row.currency)}</strong>
            </p>
          </OpsFormBody>
          <OpsFormFooter>
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button disabled={remove.isPending} onClick={() => setOpen(false)} variant="outline">
                Cancelar
              </Button>
              <Button disabled={remove.isPending} onClick={() => void confirm()} variant="destructive">
                {remove.isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Trash2 aria-hidden className="size-4" />}
                Borrar
              </Button>
            </div>
          </OpsFormFooter>
        </OpsFormDialogContent>
      </Dialog>
    </>
  );
};

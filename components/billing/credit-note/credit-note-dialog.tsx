"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { formatMoney } from "@/components/billing/billing-format";
import { BillingPdfLink } from "@/components/billing/billing-issue-status";
import { OpsFormBody, OpsFormDialogContent, OpsFormFooter, OpsFormHeader } from "@/components/ops/shared/ops-form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { CreditNoteView } from "@/data/billing/credit-note";

export type CreditDialogResult = { error?: string; noteId?: string; success?: string; unknown?: boolean } | null;

// Confirmar (regla 2: cliente, total y ambiente), emitir en Biller y el
// resultado: emitida con su PDF, sin confirmar (se reintenta desde la página)
// o por qué no salió.
export const CreditNoteDialog = ({
  backHref,
  onConfirm,
  onOpenChange,
  open,
  pending,
  result,
  total,
  view,
}: {
  backHref: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
  result: CreditDialogResult;
  total: number;
  view: CreditNoteView;
}) => {
  const production = view.biller.environment === "production";
  const title = pending
    ? "Emitiendo en Biller…"
    : result?.success ?? (result?.unknown ? "Sin confirmar" : result?.error ? "No se emitió" : `Emitir ${view.noteLabel ?? "nota de crédito"}`);

  return (
    <Dialog onOpenChange={(next) => !pending && onOpenChange(next)} open={open}>
      <OpsFormDialogContent size="md">
        <OpsFormHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {pending
              ? "Si se corta, Bambú busca el número interno antes de reintentar."
              : result?.success
                ? "Pendiente ante DGI. El estado se actualiza solo; Biller le manda el PDF al cliente."
                : result?.error ?? (production ? "Producción: tiene valor fiscal." : "Biller test: sin valor fiscal.")}
          </DialogDescription>
        </OpsFormHeader>
        {!result && !pending ? (
          <OpsFormBody>
            <dl className="rounded-xl border border-ops-border px-3.5 py-1 text-sm">
              {[
                ["Cliente", view.invoice.name],
                ["Corrige", `${view.invoice.cfeLabel} ${[view.invoice.series, view.invoice.number].filter(Boolean).join(" ")}`],
                ["Total", `−${formatMoney(total, view.invoice.currency)}`],
                ["Ambiente", production ? "Producción" : "Biller test"],
              ].map(([label, value]) => (
                <div className="flex justify-between gap-3 border-b border-ops-border/60 py-2.5 last:border-b-0" key={label}>
                  <dt className="text-ops-text-muted">{label}</dt>
                  <dd className="font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
              La nota queda emitida y referencia a la factura. No se puede editar después.
            </p>
          </OpsFormBody>
        ) : null}
        <OpsFormFooter>
          {pending ? (
            <Button disabled variant="outline">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Emitiendo…
            </Button>
          ) : result?.success || result?.unknown ? (
            <>
              {result.success && result.noteId ? <BillingPdfLink className="h-10" id={result.noteId} label="Ver PDF" /> : null}
              <Button asChild>
                <Link href={backHref}>Volver a Facturación</Link>
              </Button>
            </>
          ) : result?.error ? (
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button onClick={() => onOpenChange(false)} variant="outline">Cancelar</Button>
              <Button onClick={onConfirm}>Emitir · −{formatMoney(total, view.invoice.currency)}</Button>
            </>
          )}
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};

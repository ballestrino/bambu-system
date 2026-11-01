"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";

import { formatMoney, getShortCfeLabel } from "@/components/billing/billing-format";
import { BillingPdfLink } from "@/components/billing/billing-issue-status";
import { OpsFormBody, OpsFormDialogContent, OpsFormFooter, OpsFormHeader } from "@/components/ops/shared/ops-form-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogDescription, DialogTitle } from "@/components/ui/dialog";

export type NewInvoiceDialogResult = { error?: string; invoiceId?: string; success?: string; unknown?: boolean } | null;

type Props = {
  backHref: string;
  cfeType: number;
  client: string;
  currency: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  pending: boolean;
  production: boolean;
  result: NewInvoiceDialogResult;
  total: number;
};

// Confirmar (regla 2: cliente, total y ambiente), emitir en Biller y el
// resultado: emitida con su PDF, sin confirmar (Reintentar manda el mismo
// número interno, no duplica) o por qué no salió.
export const NewInvoiceDialog = ({ backHref, cfeType, client, currency, onConfirm, onOpenChange, open, pending, production, result, total }: Props) => {
  const label = getShortCfeLabel(cfeType);
  const title = pending ? "Emitiendo en Biller…" : result?.success ?? (result?.unknown ? "Sin confirmar" : result?.error ? "No se emitió" : `Emitir ${label}`);
  const description = pending
    ? "Si se corta, Bambú busca el número interno antes de reintentar."
    : result?.success
      ? "El estado ante DGI se actualiza solo; Biller le manda el PDF al cliente."
      : result?.error ?? (production ? "Producción: tiene valor fiscal." : "Biller test: sin valor fiscal.");

  return (
    <Dialog onOpenChange={(next) => !pending && onOpenChange(next)} open={open}>
      <OpsFormDialogContent size="md">
        <OpsFormHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </OpsFormHeader>
        {!result && !pending ? (
          <OpsFormBody>
            <dl className="rounded-xl border border-ops-border px-3.5 py-1 text-sm">
              {[
                ["Cliente", client],
                ["Total", formatMoney(total, currency)],
                ["Ambiente", production ? "Producción" : "Biller test"],
              ].map(([name, value]) => (
                <div className="flex justify-between gap-3 border-b border-ops-border/60 py-2.5 last:border-b-0" key={name}>
                  <dt className="text-ops-text-muted">{name}</dt>
                  <dd className="text-right font-medium tabular-nums">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[13px] text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
              Una factura emitida no se edita: se corrige con una nota de crédito.
            </p>
          </OpsFormBody>
        ) : null}
        <OpsFormFooter>
          {pending ? (
            <Button disabled variant="outline">
              <Loader2 aria-hidden className="size-4 animate-spin" />
              Emitiendo…
            </Button>
          ) : result?.success ? (
            <>
              {result.invoiceId ? <BillingPdfLink className="h-10" id={result.invoiceId} label="Ver PDF" /> : null}
              <Button asChild>
                <Link href={backHref}>Volver a Facturación</Link>
              </Button>
            </>
          ) : result?.unknown ? (
            <>
              <Button asChild variant="outline">
                <Link href={backHref}>Volver a Facturación</Link>
              </Button>
              <Button onClick={onConfirm}>Reintentar</Button>
            </>
          ) : result?.error ? (
            <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
          ) : (
            <>
              <Button onClick={() => onOpenChange(false)} variant="outline">Cancelar</Button>
              <Button onClick={onConfirm}>Emitir · {formatMoney(total, currency)}</Button>
            </>
          )}
        </OpsFormFooter>
      </OpsFormDialogContent>
    </Dialog>
  );
};

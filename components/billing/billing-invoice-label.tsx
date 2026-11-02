"use client";

import { Loader2, Pencil, Tag } from "lucide-react";
import { useState } from "react";

import { BillingChip } from "@/components/billing/billing-chip";
import { useInvoiceLabel } from "@/components/billing/hooks/use-invoice-label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { INVOICE_LABEL_MAX } from "@/lib/billing/invoice-label";

type LabelRow = { consumer: boolean; id: string; label: string | null; labelHint: string | null; name: string; updatedAt: string };

const linkButton =
  "inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-xs font-semibold text-ops-bamboo-strong hover:bg-ops-surface-muted disabled:opacity-60";
const actionButton = "h-9 rounded-lg px-3 text-sm font-semibold disabled:opacity-60";

// El título interno de una factura a consumidor final (feature 51): solo
// para Bambú, no va a Biller ni al PDF. Con título, la fila se puede vincular
// a un trabajo. La pista es la dirección de la adenda: se usa con un toque.
export const BillingInvoiceLabel = ({ periodKey, row }: { periodKey: string; row: LabelRow }) => {
  const mutation = useInvoiceLabel(periodKey, row.id, row.updatedAt);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(row.label ?? "");
  if (!row.consumer) return null;

  const save = (label: string | null) => {
    setOpen(false);
    if ((label?.trim() || null) !== row.label) mutation.mutate(label);
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {row.label ? <BillingChip className="h-5 text-[11px]">Consumidor final</BillingChip> : null}
      <Popover
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setValue(row.label ?? "");
        }}
        open={open}
      >
        <PopoverTrigger
          aria-label={row.label ? `Cambiar el título de ${row.name}` : "Ponerle un título a este consumidor final"}
          className={linkButton}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <Loader2 aria-hidden className="size-3.5 animate-spin" />
          ) : row.label ? (
            <Pencil aria-hidden className="size-3.5" />
          ) : (
            <Tag aria-hidden className="size-3.5" />
          )}
          {row.label ? null : "Ponerle un título"}
        </PopoverTrigger>
        <PopoverContent align="start" className="flex w-80 flex-col gap-2.5 p-3">
          <form
            className="flex flex-col gap-2.5"
            onSubmit={(event) => {
              event.preventDefault();
              save(value.trim() || null);
            }}
          >
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ops-text">
              Título (solo para Bambú)
              <input
                autoFocus
                className="h-10 rounded-lg border border-ops-border bg-ops-surface px-3 text-sm font-normal text-ops-text outline-none focus-visible:ring-2 focus-visible:ring-ops-bamboo/40"
                maxLength={INVOICE_LABEL_MAX}
                onChange={(event) => setValue(event.target.value)}
                placeholder={row.labelHint ?? "Por ejemplo, Daniela hogar"}
                value={value}
              />
            </label>
            {row.labelHint && !value ? (
              <button className={`${linkButton} self-start`} onClick={() => setValue(row.labelHint ?? "")} type="button">
                Usar «{row.labelHint}», de la adenda
              </button>
            ) : null}
            <p className="text-xs text-ops-text-muted">
              No sale en la factura ni va a Biller. Pasa a los meses siguientes y sirve para vincular un trabajo.
            </p>
            <div className="flex justify-end gap-2">
              {row.label ? (
                <button className={`${actionButton} text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40`} onClick={() => save(null)} type="button">
                  Quitar
                </button>
              ) : null}
              <button className={`${actionButton} bg-ops-bamboo-strong text-white hover:opacity-90 dark:text-ops-canvas`} disabled={!value.trim()} type="submit">
                Guardar
              </button>
            </div>
          </form>
        </PopoverContent>
      </Popover>
    </span>
  );
};

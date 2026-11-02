"use client";

import { useState } from "react";

import { BillingDeleteDraft } from "@/components/billing/billing-delete-draft";
import { getDraftRowChip } from "@/components/billing/billing-draft-model";
import type { DraftRowProps } from "@/components/billing/billing-draft-row";
import { formatMoney, getShortCfeLabel } from "@/components/billing/billing-format";
import { BillingInvoiceLabel } from "@/components/billing/billing-invoice-label";
import { BillingJobLink } from "@/components/billing/billing-job-link";
import { AmountInput, CommitInput } from "@/components/billing/billing-inputs";
import { BillingIssueStatus, BillingPdfLink } from "@/components/billing/billing-issue-status";
import { JobsCheckbox } from "@/components/ops/jobs/jobs-checkbox";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { BILLING_ITEM_CONCEPT_MAX } from "@/schemas/billing";

const fieldClass =
  "h-12 w-full rounded-xl border border-ops-border bg-ops-surface px-3.5 text-base text-ops-text outline-none focus:border-ops-bamboo focus:ring-3 focus:ring-ops-bamboo/20 disabled:opacity-60";

// Una fila del borrador en el teléfono: casilla y un botón con el receptor y
// el monto; tocarla abre una hoja para el detalle y los montos.
export const BillingDraftPhoneRow = ({
  choices,
  firstSkipped,
  locked,
  onEditLine,
  onOpen,
  onToggle,
  periodKey,
  prevMonth,
  row,
}: DraftRowProps & { firstSkipped: boolean; prevMonth: string }) => {
  const [open, setOpen] = useState(false);
  const chip = getDraftRowChip(row);
  const jobWarnings = row.status === "DRAFT" ? row.jobLink?.warnings.length ?? 0 : 0;
  const warn = chip?.label === "Precio cambiado" || jobWarnings > 0;
  const sub = [
    getShortCfeLabel(row.cfeType),
    chip?.label ?? (row.lines.length > 1 ? `${row.lines.length} líneas` : null),
    jobWarnings ? (jobWarnings === 1 ? "1 aviso del trabajo" : `${jobWarnings} avisos del trabajo`) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "flex items-center border-b border-ops-border/70 last:border-b-0",
        firstSkipped && "border-t-[6px] border-t-ops-canvas",
        !row.selected && "bg-ops-surface-muted/50"
      )}
    >
      <label className="flex h-[52px] w-11 flex-none items-center justify-center">
        <JobsCheckbox checked={row.selected} disabled={locked} label={`Emitir a ${row.name}`} onCheckedChange={onToggle} />
      </label>
      <button
        aria-label={`Editar ${row.name}`}
        className="flex min-h-14 min-w-0 flex-1 items-center gap-2.5 py-2 pr-3.5 text-left active:bg-ops-surface-muted disabled:opacity-80"
        disabled={!row.lines.length && locked}
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className={cn("flex min-w-0 flex-1 flex-col gap-0.5", !row.selected && "opacity-75")}>
          <span className="truncate text-[15px] font-semibold text-ops-text">{row.name}</span>
          <span className={cn("text-xs text-ops-text-muted", warn && "font-semibold text-amber-800 dark:text-amber-200")}>{sub}</span>
          {row.status !== "DRAFT" || row.error ? <BillingIssueStatus pdf={false} row={row} /> : null}
        </span>
        <span className="flex flex-col items-end gap-0.5 tabular-nums">
          <span className="text-[15px] font-semibold text-ops-text">{formatMoney(row.subtotal, row.currency)}</span>
          {row.priceChanged && row.prevSubtotal !== null ? (
            <span className="text-xs text-ops-text-muted line-through">{formatMoney(row.prevSubtotal, row.currency)}</span>
          ) : null}
        </span>
      </button>
      <Sheet onOpenChange={setOpen} open={open}>
        <SheetContent className="gap-3.5 rounded-t-[20px] px-4 pt-3 pb-[calc(1.75rem+env(safe-area-inset-bottom))]" side="bottom">
          <SheetHeader className="p-0">
            <SheetTitle className="text-[19px]">{row.name}</SheetTitle>
            <SheetDescription>
              {getShortCfeLabel(row.cfeType)}
              {row.prevSubtotal !== null ? ` · ${prevMonth} ${formatMoney(row.prevSubtotal, row.currency)}` : ""}
            </SheetDescription>
          </SheetHeader>
          {row.error ? <p className="text-sm text-red-700 dark:text-red-300">{row.error}</p> : null}
          {row.hasPdf ? <BillingPdfLink className="self-start" id={row.id} label="Ver PDF" /> : null}
          <BillingInvoiceLabel periodKey={periodKey} row={row} />
          <BillingJobLink choices={choices} periodKey={periodKey} row={row} />
          {row.lines.map((line, index) => (
            <div className="flex flex-col gap-2" key={index}>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ops-text">
                {row.lines.length > 1 ? `Detalle de la línea ${index + 1}` : "Detalle"}
                <CommitInput
                  className={fieldClass}
                  disabled={locked}
                  maxLength={BILLING_ITEM_CONCEPT_MAX}
                  onCommit={(concepto) => (concepto ? onEditLine({ concepto, index }) : false)}
                  value={line.concepto}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ops-text">
                <span>
                  {line.cantidad !== 1 ? `Precio unitario (× ${line.cantidad})` : "Monto"}
                  {line.prevPrecio !== null ? (
                    <span className="font-normal text-ops-text-muted"> · {prevMonth} {formatMoney(line.prevPrecio, row.currency)}</span>
                  ) : null}
                </span>
                <AmountInput
                  amount={line.precio}
                  className={cn(fieldClass, "w-full text-left text-base")}
                  currency={row.currency}
                  disabled={locked}
                  onCommit={(precio) => onEditLine({ index, precio })}
                />
              </label>
            </div>
          ))}
          <div className="flex justify-between px-0.5 py-1 text-sm">
            <span className="text-ops-text-muted">Total{row.taxed ? " con IVA" : ""}</span>
            <strong className="tabular-nums">{formatMoney(row.taxed ? row.total : row.subtotal, row.currency)}</strong>
          </div>
          <button
            className="h-[52px] rounded-xl bg-ops-bamboo-strong text-base font-semibold text-white dark:text-ops-canvas"
            onClick={() => setOpen(false)}
            type="button"
          >
            Listo
          </button>
          {onOpen ? (
            <button
              className="h-11 rounded-xl border border-ops-border text-[15px] font-semibold text-ops-text active:bg-ops-surface-muted"
              onClick={() => {
                setOpen(false);
                onOpen();
              }}
              type="button"
            >
              Editar todos los campos
            </button>
          ) : null}
          {locked ? null : <BillingDeleteDraft periodKey={periodKey} row={row} variant="sheet" />}
        </SheetContent>
      </Sheet>
    </div>
  );
};

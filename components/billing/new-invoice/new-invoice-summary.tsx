"use client";

import { Check, Loader2 } from "lucide-react";

import { formatMoney, getShortCfeLabel } from "@/components/billing/billing-format";
import { Button } from "@/components/ui/button";
import type { NewInvoiceView } from "@/data/billing/new-invoice";
import { getNewInvoiceTotals, type NewInvoiceForm } from "@/lib/billing/new-invoice";

type Props = {
  form: NewInvoiceForm;
  onIssue: () => void;
  onSave: () => void;
  problems: string[];
  saving: boolean;
  view: NewInvoiceView;
};

const clientName = (form: NewInvoiceForm) =>
  form.cfeType === 101 && form.consumer ? "Consumidor final" : form.name.trim() || "Sin cliente todavía";

// La columna fija de la derecha (abajo en el teléfono, con una barra fija con
// el total y "Emitir ahora"): neto, IVA por tasa, total, lo que falta y las
// dos salidas, emitir ahora o guardar en el borrador del mes.
export const NewInvoiceSummary = ({ form, onIssue, onSave, problems, saving, view }: Props) => {
  const totals = getNewInvoiceTotals(form);
  const blocked = problems.length > 0 || !view.biller.configured;
  const environment = !view.biller.configured ? "Sin configurar" : view.biller.environment === "production" ? "Producción" : "Biller test";

  return (
    <>
      <aside aria-label="Resumen de la factura" className="flex flex-col gap-3 lg:sticky lg:top-4">
        <section className="flex flex-col gap-3.5 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-4 md:p-[18px]">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-semibold text-ops-bamboo-strong">{getShortCfeLabel(form.cfeType)}</span>
            <span className="text-[15px] font-semibold text-ops-text">{clientName(form)}</span>
          </div>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ops-text-muted">Neto</dt>
              <dd className="tabular-nums">{formatMoney(totals.subtotal, form.currency)}</dd>
            </div>
            {totals.taxes.map((tax) => (
              <div className="flex justify-between gap-3" key={tax.rate}>
                <dt className="text-ops-text-muted">IVA {Math.round(tax.rate * 100)}%</dt>
                <dd className="tabular-nums">{formatMoney(tax.amount, form.currency)}</dd>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 border-t border-ops-border/70 pt-2.5">
              <dt className="font-semibold">Total</dt>
              <dd className="text-2xl font-semibold tracking-tight tabular-nums">{formatMoney(totals.total, form.currency)}</dd>
            </div>
          </dl>
          {problems.length ? (
            <ul className="flex list-disc flex-col gap-1 rounded-[10px] border border-amber-200 bg-amber-50 py-2.5 pr-3 pl-7 text-[13px] text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
              {problems.map((problem) => <li key={problem}>{problem}</li>)}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-[13px] text-ops-bamboo-strong">
              <Check aria-hidden className="size-4" />
              Lista para emitir
            </p>
          )}
          <div className="flex flex-col gap-2">
            <Button className="h-11" disabled={blocked || saving || !view.biller.issueEnabled} onClick={onIssue}>
              Emitir ahora
            </Button>
            <Button className="h-11" disabled={problems.length > 0 || saving || view.draftIssuing} onClick={onSave} variant="outline">
              {saving ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
              Guardar en el borrador de {view.monthName}
            </Button>
            {view.draftIssuing ? (
              <p className="text-[12.5px] text-ops-text-muted">El borrador de {view.monthName} se está emitiendo: se puede guardar cuando termine.</p>
            ) : null}
            {view.biller.configured && !view.biller.issueEnabled ? (
              <p className="text-[12.5px] text-ops-text-muted">Emitir está apagado (BILLER_ISSUE_ENABLED=false).</p>
            ) : null}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t border-ops-border/70 pt-3 text-[12.5px]">
            <dt className="text-ops-text-muted">Número interno</dt>
            <dd className="text-right">Se asigna al guardar</dd>
            <dt className="text-ops-text-muted">Ambiente</dt>
            <dd className="text-right">{environment}</dd>
          </dl>
        </section>
      </aside>
      <div className="sticky bottom-0 z-10 -mx-4 flex items-center gap-3 border-t border-ops-border bg-ops-canvas/95 px-4 pt-2.5 pb-[calc(12px+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-ops-text-muted">{getShortCfeLabel(form.cfeType)}</span>
          <span className="text-lg font-semibold tabular-nums">{formatMoney(totals.total, form.currency)}</span>
        </div>
        <Button className="h-11" disabled={blocked || saving || !view.biller.issueEnabled} onClick={onIssue}>
          Emitir ahora
        </Button>
      </div>
    </>
  );
};

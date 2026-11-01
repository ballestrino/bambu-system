"use client";

import { Check } from "lucide-react";

import { formatMoney } from "@/components/billing/billing-format";
import { getCreditProblems, getCreditTotals, type CreditDraft } from "@/components/billing/credit-note/credit-note-model";
import { Button } from "@/components/ui/button";
import type { CreditNoteView } from "@/data/billing/credit-note";

// La columna fija de la derecha (abajo en el teléfono): el tipo de nota, el
// neto, el IVA y el total, lo que falta para emitir y "Emitir nota de crédito".
export const CreditNoteSummary = ({
  draft,
  onIssue,
  view,
}: {
  draft: CreditDraft;
  onIssue: () => void;
  view: CreditNoteView;
}) => {
  const totals = getCreditTotals(view, draft);
  const problems = getCreditProblems(view, draft);
  const currency = view.invoice.currency;

  return (
    <aside aria-label="Resumen de la nota" className="flex flex-col gap-3 lg:sticky lg:top-4">
      <section className="flex flex-col gap-3.5 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-4 md:p-[18px]">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-ops-bamboo-strong">{view.noteLabel ?? "Nota de crédito"}</span>
          <span className="text-[15px] font-semibold text-ops-text">{view.invoice.name}</span>
        </div>
        <dl className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ops-text-muted">Neto</dt>
            <dd className="tabular-nums">{formatMoney(totals.subtotal, currency)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ops-text-muted">IVA</dt>
            <dd className="tabular-nums">{formatMoney(totals.iva, currency)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3 border-t border-ops-border/70 pt-2.5">
            <dt className="font-semibold">Total</dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">−{formatMoney(totals.total, currency)}</dd>
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
        <Button className="h-11" disabled={problems.length > 0} onClick={onIssue}>
          Emitir nota de crédito
        </Button>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 border-t border-ops-border/70 pt-3 text-[12.5px]">
          <dt className="text-ops-text-muted">Número interno</dt>
          <dd className="text-right">Se asigna al emitir</dd>
          <dt className="text-ops-text-muted">Ambiente</dt>
          <dd className="text-right">
            {!view.biller.configured ? "Sin configurar" : view.biller.environment === "production" ? "Producción" : "Biller test"}
          </dd>
        </dl>
      </section>
    </aside>
  );
};

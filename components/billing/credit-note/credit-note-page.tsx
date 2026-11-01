"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BillingChip } from "@/components/billing/billing-chip";
import { formatCfeNumber } from "@/components/billing/billing-format";
import { CreditNoteDialog, type CreditDialogResult } from "@/components/billing/credit-note/credit-note-dialog";
import { CreditNoteHistory } from "@/components/billing/credit-note/credit-note-history";
import { CreditNoteLines } from "@/components/billing/credit-note/credit-note-lines";
import { getCreditTotals, toCreditRequest, type CreditDraft } from "@/components/billing/credit-note/credit-note-model";
import { CreditNoteSource } from "@/components/billing/credit-note/credit-note-source";
import { CreditNoteSummary } from "@/components/billing/credit-note/credit-note-summary";
import { useCreditNote } from "@/components/billing/hooks/use-credit-note";
import { OpsPageShell, selectOpsMonth } from "@/components/ops/shared";
import type { CreditNoteView } from "@/data/billing/credit-note";

export const BILLING_HREF = "/dashboard/billing";

// Nota de crédito de una factura emitida (docs/billing.md, diseño B). Se
// emite al confirmar y no queda en borrador. El agente puede abrirla con el
// alcance, los montos y la razón ya puestos (initial), pero emitir es acá.
export const CreditNotePage = ({ initial, view }: { initial: CreditDraft; view: CreditNoteView }) => {
  const [draft, setDraft] = useState(initial);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CreditDialogResult>(null);
  const { issue, retry } = useCreditNote();
  const number = formatCfeNumber(view.invoice.series, view.invoice.number);
  const busy = issue.isPending || Boolean(view.blocker);

  // Volver a Facturación abre el mes de la factura (el selector es compartido).
  useEffect(() => selectOpsMonth(view.invoice.periodKey), [view.invoice.periodKey]);

  const confirm = async () => {
    try {
      setResult(await issue.mutateAsync(toCreditRequest(view, draft)));
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : "No se pudo emitir la nota" });
    }
  };

  return (
    <OpsPageShell className="gap-4 md:gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <nav aria-label="Ubicación" className="text-[13px] text-ops-text-muted">
            <Link className="hover:underline" href={BILLING_HREF}>Facturación</Link> / Emitidas / {number}
          </nav>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-ops-text md:text-[28px]">Nota de crédito</h1>
            {view.biller.configured ? (
              <BillingChip dot tone={view.biller.environment === "production" ? "success" : "warning"}>
                {view.biller.environment === "production" ? "Producción" : "Test"}
              </BillingChip>
            ) : null}
          </div>
          <p className="text-sm text-ops-text-muted">
            Corrige la {view.invoice.cfeLabel} {number} de {view.invoice.name.replace(/\.$/, "")}. Se emite al confirmar: no queda en
            borrador.
          </p>
        </div>
        <Link
          className="flex h-10 items-center rounded-[10px] border border-ops-border bg-ops-surface px-3.5 text-sm font-medium text-ops-text hover:bg-ops-surface-muted"
          href={BILLING_HREF}
        >
          Cancelar
        </Link>
      </header>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-4">
          <CreditNoteHistory onRetry={(id) => retry.mutate(id)} retrying={retry.isPending} view={view} />
          <CreditNoteSource disabled={busy} draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} view={view} />
          <CreditNoteLines disabled={busy} draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} view={view} />
        </div>
        <div className="lg:w-[320px] lg:flex-none">
          <CreditNoteSummary draft={draft} onIssue={() => { setResult(null); setOpen(true); }} view={view} />
        </div>
      </div>
      <CreditNoteDialog
        backHref={BILLING_HREF}
        onConfirm={() => void confirm()}
        onOpenChange={setOpen}
        open={open}
        pending={issue.isPending}
        result={result}
        total={getCreditTotals(view, draft).total}
        view={view}
      />
    </OpsPageShell>
  );
};

"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";

import { getDraftTotals } from "@/components/billing/billing-draft-model";
import { formatMoney, formatShortDate, pluralInvoices } from "@/components/billing/billing-format";
import { BillingIssueDialog } from "@/components/billing/billing-issue-dialog";
import { useResumeBillingIssue } from "@/components/billing/hooks/use-billing-issue";
import type { BillingMonthView } from "@/data/billing/month";
import { getDefaultDueDay } from "@/lib/billing/invoice-dates";

type Draft = NonNullable<BillingMonthView["draft"]>;

const getDisabledReason = (view: BillingMonthView, count: number) => {
  if (!view.biller.configured) return "Biller no está configurado";
  if (!view.biller.issueEnabled) return "Emitir está apagado (BILLER_ISSUE_ENABLED=false)";
  return count ? null : "No hay facturas marcadas para emitir";
};

// La barra oscura con lo marcado y "Emitir N", que abre el diálogo. Mientras
// se emite, el botón muestra el avance.
export const BillingIssueBar = ({ draft, view }: { draft: Draft; view: BillingMonthView }) => {
  const [open, setOpen] = useState(false);
  const totals = getDraftTotals(draft.rows);
  const issuing = draft.status === "ISSUING";
  const disabledReason = issuing ? null : getDisabledReason(view, totals.count);

  return (
    <div className="sticky bottom-[calc(var(--bottom-tabs-space,0px)+1rem)] z-10 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-[#244c2d] py-2.5 pr-2.5 pl-4 text-white shadow-[0_20px_45px_rgba(24,37,29,.18)] md:py-3.5 md:pr-4 md:pl-5">
      <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1">
        <span className="text-[17px] font-semibold tabular-nums">
          {totals.count} {totals.count === 1 ? "marcada" : "marcadas"} · {formatMoney(totals.amount)}
        </span>
        <span className="hidden text-[13px] text-[#cfe3d2] md:inline">
          {totals.eFactura} e-Factura · {totals.eTicket} e-Ticket · emisión {formatShortDate(view.draftIssueDay)}, vencen el{" "}
          {formatShortDate(getDefaultDueDay(view.draftIssueDay))}
        </span>
      </div>
      <button
        className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-white px-[22px] text-[15px] font-bold text-[#244c2d] focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        disabled={Boolean(disabledReason)}
        onClick={() => setOpen(true)}
        title={disabledReason ?? undefined}
        type="button"
      >
        {issuing ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
        {issuing ? "Emitiendo…" : `Emitir ${totals.count}`}
      </button>
      <BillingIssueDialog draft={draft} onOpenChange={setOpen} open={open} view={view} />
    </div>
  );
};

// Una emisión que se cortó (sin novedades hace minutos) o facturas que
// quedaron sin confirmar: se pueden mandar de nuevo sin duplicar, porque
// Biller rechaza el numero_interno repetido.
export const BillingIssueNotice = ({ draft, periodKey }: { draft: Draft; periodKey: string }) => {
  const resume = useResumeBillingIssue(periodKey);
  const pending = draft.rows.filter((row) => row.status === "ISSUING").length;
  const unknown = draft.rows.filter((row) => row.status === "UNKNOWN").length;
  const message = draft.stuck
    ? `La emisión se cortó: ${pluralInvoices(pending)} sin respuesta de Biller.`
    : draft.status !== "ISSUING" && unknown
      ? `${pluralInvoices(unknown)} sin confirmar: Biller no respondió y no aparecen por su número interno.`
      : null;
  if (!message) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-[var(--ops-radius-panel)] border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100" role="status">
      <AlertTriangle aria-hidden className="size-4 flex-none" />
      <span className="min-w-0 flex-1">{message} Reintentar no las duplica.</span>
      <button
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-400/70 bg-white px-3 font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60 dark:bg-transparent dark:text-amber-100"
        disabled={resume.isPending}
        onClick={() => resume.mutate(draft.id)}
        type="button"
      >
        {resume.isPending ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : null}
        {draft.stuck ? "Continuar" : "Reintentar"}
      </button>
    </div>
  );
};

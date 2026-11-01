"use client";

import { BillingChip } from "@/components/billing/billing-chip";
import { formatCfeNumber, formatLongDate, formatMoney, getDgiChip } from "@/components/billing/billing-format";
import { BillingPdfLink } from "@/components/billing/billing-issue-status";
import type { CreditDraft, CreditMode } from "@/components/billing/credit-note/credit-note-model";
import type { CreditNoteView } from "@/data/billing/credit-note";
import { CREDIT_REASON_MAX } from "@/lib/billing/credit-note-plan";
import { cn } from "@/lib/utils";

const cardClass = "flex flex-col gap-4 rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface p-4 md:p-5";

// "Comprobante que corrige" (diseño B): la factura emitida, el alcance de la
// nota (por el total o parcial) y la razón, que va a DGI y sale en el PDF.
export const CreditNoteSource = ({
  disabled,
  draft,
  onChange,
  view,
}: {
  disabled: boolean;
  draft: CreditDraft;
  onChange: (patch: Partial<CreditDraft>) => void;
  view: CreditNoteView;
}) => {
  const { invoice } = view;
  const dgi = getDgiChip(invoice.status, invoice.billerStatus);
  const number = formatCfeNumber(invoice.series, invoice.number);
  const modes: { desc: string; label: string; value: CreditMode }[] = [
    { desc: `Anula la ${number} entera: ${formatMoney(invoice.total, invoice.currency)}.`, label: "Por el total", value: "full" },
    { desc: "Solo lo que se corrige, por línea y sin IVA.", label: "Parcial", value: "partial" },
  ];

  return (
    <section className={cardClass}>
      <div className="flex flex-col gap-0.5">
        <h2 className="text-[17px] font-semibold text-ops-text">Comprobante que corrige</h2>
        <p className="text-[13px] text-ops-text-muted">Una factura emitida no se edita: se corrige con esta nota, que la referencia.</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-ops-border bg-ops-surface-muted/50 px-4 py-3.5">
        <div className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
          <span className="text-[15px] font-semibold text-ops-text">{invoice.cfeLabel} {number} · {invoice.name}</span>
          <span className="text-[13px] text-ops-text-muted">
            {invoice.issueDate ? `Emitida el ${formatLongDate(invoice.issueDate)}` : "Sin fecha"}
            {invoice.lines[0] ? ` · ${invoice.lines[0].concepto}` : ""}
          </span>
        </div>
        <span className="text-base font-semibold tabular-nums text-ops-text">{formatMoney(invoice.total, invoice.currency)}</span>
        <BillingChip dot tone={dgi.tone}>{dgi.label}</BillingChip>
        {invoice.hasPdf ? <BillingPdfLink id={invoice.id} label="Ver PDF" /> : null}
      </div>
      {view.credited > 0 ? (
        <p className="text-[13px] text-ops-text-muted tabular-nums">
          Ya acreditado {formatMoney(view.credited, invoice.currency)} · queda {formatMoney(view.remaining, invoice.currency)}
        </p>
      ) : null}
      <div aria-label="Alcance de la nota" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2" role="radiogroup">
        {modes.map((mode) => (
          <button
            aria-checked={draft.mode === mode.value}
            className={cn(
              "flex min-h-11 flex-col items-start gap-0.5 rounded-xl border px-3.5 py-3 text-left transition-colors disabled:opacity-60",
              draft.mode === mode.value
                ? "border-ops-bamboo bg-ops-bamboo-soft ring-2 ring-ops-bamboo/25"
                : "border-ops-border bg-ops-surface hover:bg-ops-surface-muted"
            )}
            disabled={disabled}
            key={mode.value}
            onClick={() => onChange({ mode: mode.value })}
            role="radio"
            type="button"
          >
            <span className="text-sm font-semibold text-ops-text">{mode.label}</span>
            <span className="text-[12.5px] text-ops-text-muted">{mode.desc}</span>
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ops-text">
        <span>
          Razón de la nota <span className="font-normal text-ops-text-muted">Se manda a DGI y sale en el PDF.</span>
        </span>
        <input
          className="h-11 rounded-[10px] border border-ops-border bg-ops-surface px-3 text-[15px] font-normal text-ops-text outline-none focus:border-ops-bamboo focus:ring-3 focus:ring-ops-bamboo/20 disabled:opacity-60"
          disabled={disabled}
          maxLength={CREDIT_REASON_MAX}
          onChange={(event) => onChange({ reason: event.target.value })}
          placeholder="Dos visitas no realizadas (4 y 11 de noviembre)"
          value={draft.reason}
        />
      </label>
    </section>
  );
};

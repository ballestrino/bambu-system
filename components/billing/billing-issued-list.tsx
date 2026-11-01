import Link from "next/link";

import { BillingChip } from "@/components/billing/billing-chip";
import { formatCfeNumber, formatMoney, formatShortDate, getDgiChip, getMonthName, getShortCfeLabel } from "@/components/billing/billing-format";
import { BillingPdfLink } from "@/components/billing/billing-issue-status";
import type { IssuedInvoiceRow } from "@/lib/billing/billing-month-view";

// "Emitidas": lo que Biller tiene con fecha de emisión en el mes, también lo
// emitido desde su panel, con su estado ante DGI, el PDF y la nota de crédito
// (anulada por cuál, parcial o sin confirmar).
export const BillingIssuedList = ({ periodKey, rows }: { periodKey: string; rows: IssuedInvoiceRow[] }) => {
  if (!rows.length) {
    return (
      <section className="rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface px-6 py-10 text-center text-sm text-ops-text-muted">
        Todavía no hay comprobantes emitidos en {getMonthName(periodKey)}.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface">
      {rows.map((row) => {
        const dgi = getDgiChip(row.status, row.billerStatus);
        const number = formatCfeNumber(row.series, row.number);
        return (
          <div
            className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-ops-border/70 px-3.5 py-3 last:border-b-0 md:px-[18px] md:py-3.5"
            key={row.id}
          >
            <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[15px] font-semibold text-ops-text">{row.name}</span>
                <CreditChip row={row} />
              </div>
              <span className="text-[13px] text-ops-text-muted tabular-nums">
                {getShortCfeLabel(row.cfeType)} {number} · {formatShortDate(row.issueDate)}
              </span>
              {row.detail ? <span className="truncate text-[13px] text-ops-text-muted">{row.detail}</span> : null}
            </div>
            <span className="flex-[0_0_auto] text-right text-[15px] font-semibold tabular-nums text-ops-text md:w-[120px]">
              {row.isNote && row.cfeType % 10 === 2 ? "−" : ""}
              {formatMoney(row.total, row.currency)}
            </span>
            <span className="md:w-[130px]">
              <BillingChip tone={dgi.tone}>{dgi.label}</BillingChip>
            </span>
            <span className="flex items-center gap-1 md:w-[180px] md:justify-end">
              {row.canCredit ? (
                <Link
                  className="inline-flex h-8 items-center rounded-lg px-2 text-[13px] font-semibold text-ops-bamboo-strong hover:bg-ops-surface-muted"
                  href={`/dashboard/billing/${row.id}/credit-note`}
                >
                  Nota de crédito
                </Link>
              ) : null}
              {row.hasPdf ? <BillingPdfLink id={row.id} /> : null}
            </span>
          </div>
        );
      })}
    </section>
  );
};

// "Anulada · NC MA 120424", "NC parcial $ 2.400" o una nota sin confirmar
// (se reintenta desde la página de la nota).
const CreditChip = ({ row }: { row: IssuedInvoiceRow }) => {
  const credit = row.credit;
  if (!credit) return null;
  if (row.annulled) return <BillingChip tone="archived">Anulada{credit.noteLabel ? ` · ${credit.noteLabel}` : ""}</BillingChip>;
  if (credit.unknownNoteId) {
    return (
      <Link href={`/dashboard/billing/${row.id}/credit-note`}>
        <BillingChip tone="warning">NC sin confirmar · Reintentar</BillingChip>
      </Link>
    );
  }
  if (credit.inFlight) return <BillingChip tone="active">NC emitiéndose</BillingChip>;
  return credit.credited > 0 ? <BillingChip tone="neutral">NC parcial {formatMoney(credit.credited, row.currency)}</BillingChip> : null;
};

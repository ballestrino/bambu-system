import { BillingChip } from "@/components/billing/billing-chip";
import { formatCfeNumber, formatMoney, formatShortDate, getDgiChip, getMonthName, getShortCfeLabel } from "@/components/billing/billing-format";
import { BillingPdfLink } from "@/components/billing/billing-issue-status";
import type { IssuedInvoiceRow } from "@/lib/billing/billing-month-view";

// "Emitidas": lo que Biller tiene con fecha de emisión en el mes, también lo
// emitido desde su panel, con su estado ante DGI y el PDF. La nota de
// crédito llega con la 43.
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
                {row.annulled ? <BillingChip tone="archived">Anulada</BillingChip> : null}
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
            <span className="md:w-14">{row.hasPdf ? <BillingPdfLink id={row.id} /> : null}</span>
          </div>
        );
      })}
    </section>
  );
};

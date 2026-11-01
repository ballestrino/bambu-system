import { AlertTriangle } from "lucide-react";

import { formatMoney, formatSignedMoney, getMonthName } from "@/components/billing/billing-format";
import type { BillingMonthView } from "@/data/billing/month";

type SummaryProps = { draftAmount: number; view: BillingMonthView };

const byTypeLabel = ({ eFactura, eTicket, other }: BillingMonthView["summary"]["current"]["invoicesByType"]) =>
  [`${eFactura} e-Factura`, `${eTicket} e-Ticket`, ...(other ? [`${other} otras`] : [])].join(" · ");

const pct = (amount: number, scale: number) => `${Math.max(0, Math.min(100, (amount / scale) * 100))}%`;

// Resumen del mes (diseño B): en escritorio un panel con el neto, la barra de
// lo emitido contra el borrador y al costado facturas, notas y pendientes; en
// el teléfono una tarjeta verde oscura con tres cifras.
export const BillingSummary = ({ draftAmount, view }: SummaryProps) => {
  const { current, previous } = view.summary;
  const month = getMonthName(view.period);
  const prevMonth = getMonthName(view.previousPeriod);
  const diff = current.net - previous.net;
  const scale = Math.max(previous.net, current.net + draftAmount, 1);

  return (
    <>
      <section
        aria-label="Resumen del mes"
        className="hidden flex-wrap rounded-[var(--ops-radius-panel)] border border-ops-border bg-ops-surface md:flex"
      >
        <div className="flex flex-[2_1_340px] flex-col gap-3.5 border-r border-ops-border p-6">
          <p className="text-sm font-medium text-ops-text-muted">Facturado neto en {month}</p>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-[44px] leading-none font-semibold tracking-tight tabular-nums text-ops-text">
              {formatMoney(current.net)}
            </span>
            <span className="text-sm text-ops-text-muted tabular-nums">
              {formatSignedMoney(diff)} vs {prevMonth}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <div aria-hidden className="flex h-2.5 overflow-hidden rounded-full bg-ops-surface-muted">
              <span className="h-full bg-ops-bamboo-strong" style={{ width: pct(current.net, scale) }} />
              <span className="h-full bg-[#9ccaa3]" style={{ width: pct(draftAmount, scale) }} />
            </div>
            <div className="flex flex-wrap gap-4 text-[13px] text-ops-text-muted tabular-nums">
              <Legend className="bg-ops-bamboo-strong" label={`Emitido ${formatMoney(current.net)}`} />
              <Legend className="bg-[#9ccaa3]" label={`En el borrador ${formatMoney(draftAmount)}`} />
              <span>
                {capitalize(prevMonth)}: {formatMoney(previous.net)}
              </span>
            </div>
          </div>
          {current.otherCurrencyCount ? (
            <p className="text-xs text-ops-text-muted">
              {current.otherCurrencyCount} en otra moneda no suman al neto.
            </p>
          ) : null}
        </div>
        <div className="flex flex-[1_1_260px] flex-col">
          <Stat label="Facturas emitidas" sub={byTypeLabel(current.invoicesByType)} value={current.invoiceCount}
            compare={`${prevMonth} ${previous.invoiceCount}`} />
          <Stat label="Notas de crédito" value={current.creditNoteCount}
            compare={`${prevMonth} ${previous.creditNoteCount}${previous.creditNoteCount ? ` · ${formatMoney(previous.creditNotesTotal)}` : ""}`} />
          <div className="flex flex-1 items-center justify-between gap-3 rounded-br-[var(--ops-radius-panel)] bg-amber-50 px-5 py-4 dark:bg-amber-500/10">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-amber-800 dark:text-amber-200">
              <AlertTriangle aria-hidden className="size-[15px]" />
              Pendientes ante DGI
            </span>
            <div className="text-right">
              <span className="block text-[22px] font-semibold text-amber-900 dark:text-amber-100">{current.pendingCount}</span>
              <span className="text-xs text-amber-800 dark:text-amber-200">
                {current.rejectedCount} {current.rejectedCount === 1 ? "rechazada" : "rechazadas"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Resumen del mes" className="flex flex-col gap-3.5 rounded-2xl bg-[#244c2d] p-4 text-white md:hidden">
        <div className="flex flex-col gap-0.5">
          <span className="text-[13px] text-[#cfe3d2]">Facturado neto en {month}</span>
          <span className="text-[32px] leading-tight font-semibold tracking-tight tabular-nums">{formatMoney(current.net)}</span>
          <span className="text-[13px] text-[#cfe3d2] tabular-nums">
            {formatSignedMoney(diff)} vs {prevMonth} ({formatMoney(previous.net)})
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          <Tile label={`facturas · ${shortMonth(prevMonth)} ${previous.invoiceCount}`} value={current.invoiceCount} />
          <Tile label={`NC · ${shortMonth(prevMonth)} ${previous.creditNoteCount}`} value={current.creditNoteCount} />
          <div className="flex flex-col rounded-[10px] bg-amber-50 px-2.5 py-2 text-amber-900">
            <span className="text-lg font-semibold">{current.pendingCount}</span>
            <span className="text-[11px] text-amber-800">pend. DGI</span>
          </div>
        </div>
      </section>
    </>
  );
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const shortMonth = (name: string) => (name === "septiembre" ? "set" : name.slice(0, 3));

const Legend = ({ className, label }: { className: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5">
    <span aria-hidden className={`size-2.5 rounded-[3px] ${className}`} />
    {label}
  </span>
);

const Stat = ({ compare, label, sub, value }: { compare: string; label: string; sub?: string; value: number }) => (
  <div className="flex flex-1 items-center justify-between gap-3 border-b border-ops-border px-5 py-4">
    <div className="flex flex-col gap-0.5 text-[13px] text-ops-text-muted">
      <span>{label}</span>
      {sub ? <span>{sub}</span> : null}
    </div>
    <div className="text-right">
      <span className="block text-[22px] font-semibold text-ops-text">{value}</span>
      <span className="text-xs text-ops-text-muted">{compare}</span>
    </div>
  </div>
);

const Tile = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col rounded-[10px] bg-white/10 px-2.5 py-2">
    <span className="text-lg font-semibold">{value}</span>
    <span className="text-[11px] text-[#cfe3d2]">{label}</span>
  </div>
);

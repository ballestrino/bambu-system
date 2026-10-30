import type { InvoiceStatus } from "@prisma/client";

import { classifyCfe } from "@/lib/billing/invoice-mapping";

export type SummaryInvoice = {
  cfeType: number;
  currency: string;
  status: InvoiceStatus;
  total: number | string | { toString(): string };
};

export type BillingMonthSummary = {
  creditNoteCount: number;
  creditNotesTotal: number;
  debitNoteCount: number;
  invoiceCount: number;
  invoicesByType: { eFactura: number; eTicket: number; other: number };
  invoicesTotal: number;
  net: number;
  otherCurrencyCount: number;
  pendingCount: number;
  rejectedCount: number;
};

const ISSUED_STATUSES = new Set<InvoiceStatus>(["ISSUED", "ACCEPTED", "UNKNOWN", "ISSUING"]);
const PENDING_STATUSES = new Set<InvoiceStatus>(["ISSUED", "UNKNOWN", "ISSUING"]);

const round = (amount: number) => Math.round(amount * 100) / 100;

// Lo emitido en un mes por fecha de emisión. Un borrador no cuenta; un
// rechazo de DGI no es un comprobante válido y va aparte. Neto = facturas y
// notas de débito menos notas de crédito. Los totales son en pesos: un
// comprobante en otra moneda se cuenta en otherCurrencyCount.
export const summarizeBillingMonth = (invoices: SummaryInvoice[]): BillingMonthSummary => {
  const summary: BillingMonthSummary = {
    creditNoteCount: 0,
    creditNotesTotal: 0,
    debitNoteCount: 0,
    invoiceCount: 0,
    invoicesByType: { eFactura: 0, eTicket: 0, other: 0 },
    invoicesTotal: 0,
    net: 0,
    otherCurrencyCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  };

  for (const invoice of invoices) {
    const kind = classifyCfe(invoice.cfeType);
    if (kind === "other" || invoice.status === "DRAFT") continue;
    if (invoice.status === "REJECTED") {
      summary.rejectedCount += 1;
      continue;
    }
    if (!ISSUED_STATUSES.has(invoice.status)) continue;
    if (PENDING_STATUSES.has(invoice.status)) summary.pendingCount += 1;

    const amount = Number(invoice.total.toString());
    const inPesos = invoice.currency === "UYU" && Number.isFinite(amount);
    if (!inPesos) summary.otherCurrencyCount += 1;

    if (kind === "invoice") {
      summary.invoiceCount += 1;
      const type = invoice.cfeType === 111 ? "eFactura" : invoice.cfeType === 101 ? "eTicket" : "other";
      summary.invoicesByType[type] += 1;
      if (inPesos) summary.invoicesTotal += amount;
    } else if (kind === "credit_note") {
      summary.creditNoteCount += 1;
      if (inPesos) summary.creditNotesTotal += amount;
    } else {
      summary.debitNoteCount += 1;
      if (inPesos) summary.invoicesTotal += amount;
    }
  }

  summary.invoicesTotal = round(summary.invoicesTotal);
  summary.creditNotesTotal = round(summary.creditNotesTotal);
  summary.net = round(summary.invoicesTotal - summary.creditNotesTotal);
  return summary;
};

export const compareBillingMonths = (current: BillingMonthSummary, previous: BillingMonthSummary) => ({
  ...current,
  previous: { invoiceCount: previous.invoiceCount, net: previous.net },
  delta: {
    invoiceCount: current.invoiceCount - previous.invoiceCount,
    net: round(current.net - previous.net),
  },
});

export type BillingMonthComparison = ReturnType<typeof compareBillingMonths>;

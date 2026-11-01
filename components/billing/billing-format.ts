import type { InvoiceStatus } from "@prisma/client";

import type { OpsTone } from "@/components/ops/shared/ops-theme";
import { BILLING_MONTH_NAMES } from "@/lib/billing/billing-month-text";

const moneyFormat = new Intl.NumberFormat("es-UY", { maximumFractionDigits: 2, minimumFractionDigits: 0 });

export const formatMoney = (amount: number, currency = "UYU") =>
  `${currency === "UYU" ? "$" : currency === "USD" ? "US$" : currency} ${moneyFormat.format(amount)}`;

export const formatSignedMoney = (amount: number) =>
  `${amount > 0 ? "+" : amount < 0 ? "−" : ""}${formatMoney(Math.abs(amount))}`;

// "24.400", "$ 24.400", "24400,50" o "24400.50" → número. En es-UY el punto
// separa miles y la coma decimales; un punto seguido de 3 cifras es de miles.
export const parseMoneyInput = (text: string) => {
  const raw = text.replace(/[$\s]|US/g, "");
  if (!raw) return null;
  const normalized = raw.includes(",")
    ? raw.replace(/\./g, "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(raw)
      ? raw.replace(/\./g, "")
      : raw;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Number(normalized);
};

const monthIndex = (periodKey: string) => Number(periodKey.slice(5, 7)) - 1;

export const getMonthName = (periodKey: string) => BILLING_MONTH_NAMES[monthIndex(periodKey)] ?? periodKey;

export const getMonthLabel = (periodKey: string) => `${getMonthName(periodKey)} ${periodKey.slice(0, 4)}`;

const shortMonths = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "set", "oct", "nov", "dic"];

// "2026-11-03" → "3 nov".
export const formatShortDate = (isoDate: string | null) =>
  isoDate ? `${Number(isoDate.slice(8, 10))} ${shortMonths[Number(isoDate.slice(5, 7)) - 1]}` : "";

// El estado ante DGI como chip. Un e-Ticket queda en "Envío no corresponde":
// DGI lo recibe en el reporte diario, es definitivo (docs/billing.md).
export const getDgiChip = (status: InvoiceStatus, billerStatus: string | null): { label: string; tone: OpsTone } => {
  if (status === "REJECTED") return { label: "Rechazado DGI", tone: "danger" };
  if (status === "UNKNOWN") return { label: "Sin confirmar", tone: "warning" };
  if (status === "ISSUING") return { label: "Emitiendo", tone: "active" };
  if (status === "ACCEPTED") {
    return /no corresponde/i.test(billerStatus ?? "")
      ? { label: "Reporte diario", tone: "neutral" }
      : { label: "Aceptado DGI", tone: "success" };
  }
  if (status === "DRAFT") return { label: "Borrador", tone: "neutral" };
  return { label: "Pendiente DGI", tone: "warning" };
};

export const pluralInvoices = (count: number) => `${count} ${count === 1 ? "factura" : "facturas"}`;

export const getShortCfeLabel = (cfeType: number) =>
  ({ 101: "e-Ticket", 111: "e-Factura", 102: "NC e-Ticket", 112: "NC e-Factura", 103: "ND e-Ticket", 113: "ND e-Factura" })[cfeType] ??
  `CFE ${cfeType}`;

// "MF 672168": serie y número ante DGI.
export const formatCfeNumber = (series: string | null, number: number | null) =>
  [series, number].filter((part) => part !== null && part !== "").join(" ");

// "2026-10-30" → "30/10/2026".
export const formatLongDate = (isoDate: string) =>
  `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}/${isoDate.slice(0, 4)}`;

export const getPdfHref = (invoiceId: string) => `/api/billing/invoices/${invoiceId}/pdf`;

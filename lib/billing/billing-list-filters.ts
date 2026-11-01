import type { InvoiceStatus } from "@prisma/client";

import { classifyCfe } from "@/lib/billing/invoice-mapping";

// Filtros de Facturación (feature 48, docs/billing.md): vistas Borrador,
// Emitidas y Archivadas, un panel plegable con tipo, estado ante DGI y
// marcadas, y búsqueda por cliente o RUT.
// Reglas puras: las usan la página y check:billing.

export type BillingView = "draft" | "issued" | "archived";
export type BillingTypeFilter = "efactura" | "eticket" | "note";
export type BillingDgiFilter = "pending" | "accepted" | "rejected" | "unknown";
export type BillingMarkFilter = "checked" | "unchecked";

export type BillingFilters = {
  dgi: BillingDgiFilter | null;
  mark: BillingMarkFilter | null;
  query: string;
  type: BillingTypeFilter | null;
};

export const EMPTY_BILLING_FILTERS: BillingFilters = { dgi: null, mark: null, query: "", type: null };

type FilterableRow = { cfeType: number; document: string | null; name: string; status: InvoiceStatus };

// Cada grupo es un desplegable con "Todos" (null) y sus opciones. "Borrador"
// (marcadas o no) solo se ofrece y se aplica en el borrador.
export const BILLING_FILTER_GROUPS = [
  {
    key: "type",
    label: "Tipo",
    options: [
      { label: "e-Factura", value: "efactura" },
      { label: "e-Ticket", value: "eticket" },
      { label: "Notas", value: "note" },
    ],
  },
  {
    key: "dgi",
    label: "Estado DGI",
    options: [
      { label: "Pendiente", value: "pending" },
      { label: "Aceptada", value: "accepted" },
      { label: "Rechazada", value: "rejected" },
      { label: "Sin confirmar", value: "unknown" },
    ],
  },
  {
    key: "mark",
    label: "Borrador",
    options: [
      { label: "Marcadas", value: "checked" },
      { label: "Desmarcadas", value: "unchecked" },
    ],
  },
] as const satisfies readonly {
  options: readonly { label: string; value: string }[];
  key: "type" | "dgi" | "mark";
  label: string;
}[];

export const getFilterGroups = (view: BillingView) =>
  BILLING_FILTER_GROUPS.filter((group) => group.key !== "mark" || view === "draft");

type FilterGroup = (typeof BILLING_FILTER_GROUPS)[number];

// El valor viene siempre de BILLING_FILTER_GROUPS, del mismo grupo; null es "Todos".
export const setBillingFilter = (
  filters: BillingFilters,
  key: FilterGroup["key"],
  value: FilterGroup["options"][number]["value"] | null
) => ({ ...filters, [key]: value }) as BillingFilters;

// e-Factura: la familia 11x y las de exportación; e-Ticket: la 10x; notas:
// de crédito o débito de cualquiera.
export const matchesType = (cfeType: number, type: BillingTypeFilter) => {
  const kind = classifyCfe(cfeType);
  if (type === "note") return kind === "credit_note" || kind === "debit_note";
  if (kind !== "invoice") return false;
  return type === "eticket" ? Math.floor(cfeType / 10) === 10 : Math.floor(cfeType / 10) !== 10;
};

const DGI_STATUSES: Record<BillingDgiFilter, readonly InvoiceStatus[]> = {
  accepted: ["ACCEPTED"],
  pending: ["ISSUING", "ISSUED"],
  rejected: ["REJECTED"],
  unknown: ["UNKNOWN"],
};

// Una factura del borrador que todavía no se emite no tiene estado ante DGI.
export const matchesDgi = (status: InvoiceStatus, dgi: BillingDgiFilter) => DGI_STATUSES[dgi].includes(status);

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// Por nombre (sin tildes ni mayúsculas) o por RUT/cédula: con 3 dígitos o más
// se comparan solo los dígitos, así "21.966" encuentra "219667740019".
export const matchesQuery = (row: Pick<FilterableRow, "document" | "name">, query: string) => {
  const term = normalize(query);
  if (!term) return true;
  if (normalize(row.name).includes(term)) return true;
  const digits = term.replace(/\D/g, "");
  const document = row.document?.replace(/\D/g, "") ?? "";
  return digits.length >= 3 && /^[\d\s.\-/]+$/.test(term) && document.includes(digits);
};

const matchesCommon = (row: FilterableRow, filters: BillingFilters) =>
  (!filters.type || matchesType(row.cfeType, filters.type)) &&
  (!filters.dgi || matchesDgi(row.status, filters.dgi)) &&
  matchesQuery(row, filters.query);

export const filterIssuedRows = <T extends FilterableRow>(rows: T[], filters: BillingFilters) =>
  rows.filter((row) => matchesCommon(row, filters));

export const filterDraftRows = <T extends FilterableRow & { selected: boolean }>(rows: T[], filters: BillingFilters) =>
  rows.filter(
    (row) =>
      matchesCommon(row, filters) &&
      (!filters.mark || (filters.mark === "checked" ? row.selected : !row.selected))
  );

// Cuántos filtros hay puestos en una vista (la búsqueda cuenta como uno).
export const countActiveFilters = (filters: BillingFilters, view: BillingView) =>
  [filters.type, filters.dgi, view === "draft" ? filters.mark : null, filters.query.trim() || null].filter(Boolean).length;

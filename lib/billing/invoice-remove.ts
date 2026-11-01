import type { InvoiceBatchStatus, InvoiceStatus } from "@prisma/client";

// Borrar y archivar (feature 47, docs/billing.md). Reglas puras: las usan el
// store, la página y check:billing.

// Lo que DGI ya tiene (o rechazó): nunca se borra, se archiva. Una en curso
// (ISSUING) o sin confirmar (UNKNOWN) no se toca: puede estar en Biller.
export const ARCHIVABLE_STATUSES = ["ISSUED", "ACCEPTED", "REJECTED"] as const satisfies readonly InvoiceStatus[];

// Solo una factura del borrador que todavía no se emite, en un lote abierto.
export const canDeleteDraftInvoice = (status: InvoiceStatus, batchStatus: InvoiceBatchStatus | null) =>
  status === "DRAFT" && batchStatus === "DRAFT";

export const canArchiveInvoice = (status: InvoiceStatus) =>
  (ARCHIVABLE_STATUSES as readonly InvoiceStatus[]).includes(status);

export type DeleteDraftError = "not_found" | "issued" | "not_draft" | "issuing" | "stale";

// Por qué no se puede borrar, o null si se puede.
export const getDeleteDraftError = (
  invoice: { status: InvoiceStatus; batchStatus: InvoiceBatchStatus | null } | null
): Exclude<DeleteDraftError, "stale"> | null => {
  if (!invoice) return "not_found";
  if (invoice.status !== "DRAFT") return invoice.status === "ISSUING" || invoice.status === "UNKNOWN" ? "issuing" : "issued";
  if (invoice.batchStatus === "ISSUING") return "issuing";
  return canDeleteDraftInvoice(invoice.status, invoice.batchStatus) ? null : "not_draft";
};

export const DELETE_DRAFT_ERRORS: Record<DeleteDraftError, string> = {
  issued: "Una factura emitida no se borra: se archiva o se corrige con una nota de crédito",
  issuing: "Esta factura se está emitiendo o quedó sin confirmar: no se puede borrar",
  not_draft: "Esta factura ya no está en un borrador abierto",
  not_found: "La factura ya no está en el borrador",
  stale: "Alguien cambió esta factura: se recargó la última versión",
};

export type ArchiveError = "not_found" | "not_archivable";

export const ARCHIVE_ERRORS: Record<ArchiveError, string> = {
  not_archivable: "Solo se archiva una factura emitida (aceptada, pendiente o rechazada por DGI)",
  not_found: "La factura ya no existe",
};

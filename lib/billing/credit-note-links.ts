import type { InvoiceStatus } from "@prisma/client";

import { getCreditState } from "@/lib/billing/credit-note-plan";
import { classifyCfe } from "@/lib/billing/invoice-mapping";

// Las notas de crédito que apuntan a cada factura (feature 43): la fila de
// "Emitidas" dice si está anulada o con una nota parcial y con cuál, y
// repetir el mes deja afuera solo las anuladas por el total.
export type LinkedNote = {
  cfeType: number;
  id: string;
  issueDate: Date | null;
  number: number | null;
  referenceIds: number[];
  series: string | null;
  status: InvoiceStatus;
  total: number;
};

export type InvoiceCredit = {
  credited: number;
  fully: boolean;
  inFlight: boolean;
  // La primera nota emitida, para "Anulada por NC MA 120424".
  note: { id: string; issueDate: Date | null; label: string } | null;
  // Una nota que quedó sin confirmar, para "Reintentar".
  unknownNoteId: string | null;
};

const noteLabel = (note: LinkedNote) => ["NC", note.series, note.number].filter((part) => part !== null && part !== "").join(" ");

// billerId de cada factura → su estado de crédito. Una nota que apunta a
// varias facturas (referencia a varias) anula todas.
export const linkCreditNotes = (invoices: { billerId: number | null; total: number }[], notes: LinkedNote[]) => {
  const credit = notes.filter((note) => classifyCfe(note.cfeType) === "credit_note" && note.status !== "DRAFT");
  const result = new Map<number, InvoiceCredit>();
  for (const invoice of invoices) {
    if (invoice.billerId === null) continue;
    const billerId = invoice.billerId;
    const mine = credit.filter((note) => note.referenceIds.includes(billerId));
    if (!mine.length) continue;
    const shared = mine.some((note) => note.referenceIds.length > 1 && note.status !== "REJECTED");
    const state = getCreditState(invoice, mine);
    const issued = mine
      .filter((note) => note.status === "ISSUED" || note.status === "ACCEPTED")
      .sort((a, b) => (a.issueDate?.getTime() ?? 0) - (b.issueDate?.getTime() ?? 0));
    result.set(billerId, {
      credited: state.credited,
      fully: state.fully || shared,
      inFlight: state.inFlight,
      note: issued[0] ? { id: issued[0].id, issueDate: issued[0].issueDate, label: noteLabel(issued[0]) } : null,
      unknownNoteId: mine.find((note) => note.status === "UNKNOWN")?.id ?? null,
    });
  }
  return result;
};

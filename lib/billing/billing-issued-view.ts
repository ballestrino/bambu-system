import type { InvoiceStatus } from "@prisma/client";

import type { InvoiceCredit } from "@/lib/billing/credit-note-links";
import { CREDIT_NOTE_TYPE } from "@/lib/billing/credit-note-plan";
import { canSendInvoice, toDeliveryRows, type DeliveryInput, type DeliveryRow } from "@/lib/billing/invoice-delivery";
import { readStoredItems, readStoredReceiver } from "@/lib/billing/invoice-json";
import { getReceiverDisplay } from "@/lib/billing/invoice-label";
import { classifyCfe, getCfeLabel } from "@/lib/billing/invoice-mapping";
import { canArchiveInvoice } from "@/lib/billing/invoice-remove";

type Amount = number | string | { toString(): string };
const toNumber = (value: Amount) => Number(value.toString());
const isoDate = (date: Date | null) => (date ? date.toISOString().slice(0, 10) : null);

// Una fila de "Emitidas": lo que hay en Biller con fecha de emisión en el mes.
export type IssuedInvoiceRow = {
  annulled: boolean;
  // Archivada (47): sale de "Emitidas" y sigue en el resumen.
  archivedAt: string | null;
  canArchive: boolean;
  // Si admite una nota de crédito ahora (emitida, sin anular ni una en curso).
  canCredit: boolean;
  // Si se puede mandar por correo o anotar como enviada (53): emitida, no rechazada.
  canSend: boolean;
  // Sin receptor con nombre (51): se le puede poner un título interno.
  consumer: boolean;
  // Las notas que la corrigen: lo acreditado, la primera nota y una sin confirmar.
  credit: { credited: number; inFlight: boolean; noteLabel: string | null; unknownNoteId: string | null } | null;
  // A dónde se mandó (53): correos de Bambú y anotaciones de una persona.
  deliveries: DeliveryRow[];
  billerStatus: string | null;
  cfeLabel: string;
  cfeType: number;
  currency: string;
  detail: string | null;
  // RUT o cédula del receptor, para buscar (48).
  document: string | null;
  hasPdf: boolean;
  id: string;
  isNote: boolean;
  issueDate: string | null;
  label: string | null;
  // Pista para el título: la dirección de la adenda (no se guarda sola).
  labelHint: string | null;
  name: string;
  number: number | null;
  // Los correos que Biller tiene del receptor: el diálogo de enviar los sugiere.
  receiverEmails: string[];
  series: string | null;
  status: InvoiceStatus;
  total: number;
  updatedAt: string;
};

export const toIssuedRow = (
  invoice: {
    adenda?: string | null; archivedAt?: Date | null; billerId: number | null; billerStatus: string | null; cfeType: number;
    currency: string; deliveries?: DeliveryInput[]; id: string; issueDate: Date | null; items: unknown; label?: string | null; number: number | null;
    receiver: unknown; series: string | null; status: InvoiceStatus; total: Amount; updatedAt: Date;
  },
  credits: Map<number, InvoiceCredit>
): IssuedInvoiceRow => {
  const credit = invoice.billerId === null ? undefined : credits.get(invoice.billerId);
  const receiver = readStoredReceiver(invoice.receiver);
  return {
    annulled: credit?.fully ?? false,
    archivedAt: invoice.archivedAt?.toISOString() ?? null,
    canArchive: canArchiveInvoice(invoice.status),
    canCredit:
      Boolean(CREDIT_NOTE_TYPE[invoice.cfeType]) && invoice.billerId !== null &&
      (invoice.status === "ISSUED" || invoice.status === "ACCEPTED") && !credit?.fully && !credit?.inFlight,
    canSend: canSendInvoice(invoice),
    ...getReceiverDisplay(receiver, invoice.label, invoice.adenda),
    credit: credit
      ? { credited: credit.credited, inFlight: credit.inFlight, noteLabel: credit.note?.label ?? null, unknownNoteId: credit.unknownNoteId }
      : null,
    billerStatus: invoice.billerStatus,
    cfeLabel: getCfeLabel(invoice.cfeType),
    cfeType: invoice.cfeType,
    currency: invoice.currency,
    deliveries: toDeliveryRows(invoice.deliveries),
    detail: readStoredItems(invoice.items)?.[0]?.concepto ?? null,
    document: receiver?.documento ?? null,
    hasPdf: invoice.billerId !== null,
    id: invoice.id,
    isNote: classifyCfe(invoice.cfeType) !== "invoice",
    issueDate: isoDate(invoice.issueDate),
    number: invoice.number,
    receiverEmails: receiver?.sucursal.emails ?? [],
    series: invoice.series,
    status: invoice.status,
    total: toNumber(invoice.total),
    updatedAt: invoice.updatedAt.toISOString(),
  };
};

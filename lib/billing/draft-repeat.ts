import type { InvoiceStatus } from "@prisma/client";

import { getBillingMonthName, moveMonthInText } from "@/lib/billing/billing-month-text";
import {
  classifyCfe,
  type InvoiceItemPayload,
  type InvoiceReceiverPayload,
} from "@/lib/billing/invoice-mapping";
import { getItemsTotal } from "@/lib/billing/invoice-totals";

// Una factura del mes anterior (copia local) que se puede repetir.
export type RepeatSource = {
  adenda: string | null;
  billerId: number | null;
  cfeType: number;
  currency: string;
  dueDate: Date | null;
  id: string;
  issueDate: Date | null;
  items: InvoiceItemPayload[] | null;
  // Título interno (51): pasa al mes nuevo, así el vínculo con el trabajo sigue.
  label?: string | null;
  paymentForm: number | null;
  receiver: InvoiceReceiverPayload | null;
  receiverDocument: string | null;
  status: InvoiceStatus;
};

export type RepeatContext = {
  // billerId de una factura → fecha de la nota de crédito que la referencia.
  annulledBy: Map<number, Date>;
  // Documento del receptor → primera fecha en que ya se le facturó en el mes nuevo.
  billedInTarget: Map<string, Date>;
  from: Date;
  to: Date;
};

export type RepeatSkipKind = "annulled" | "billed" | "note" | "no_items";
export type RepeatSkip = { kind: RepeatSkipKind; label: string };

export const PAYMENT_FORM = { CASH: 1, CREDIT: 2 } as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const REPEATABLE_STATUSES = new Set<InvoiceStatus>(["ISSUED", "ACCEPTED", "UNKNOWN"]);

// Se repite lo emitido del mes anterior: facturas y notas (estas arrancan
// desmarcadas). Un rechazo de DGI o un borrador no se repiten.
export const isRepeatSource = (source: Pick<RepeatSource, "cfeType" | "status">) =>
  REPEATABLE_STATUSES.has(source.status) && classifyCfe(source.cfeType) !== "other";

const dayLabel = (date: Date) => `${date.getUTCDate()}/${date.getUTCMonth() + 1}`;

// Por qué una factura del mes anterior arranca desmarcada (null: va).
export const getRepeatSkip = (source: RepeatSource, context: RepeatContext): RepeatSkip | null => {
  const kind = classifyCfe(source.cfeType);
  if (kind === "credit_note") return { kind: "note", label: "Nota de crédito" };
  if (kind === "debit_note") return { kind: "note", label: "Nota de débito" };

  const annulledOn = source.billerId === null ? undefined : context.annulledBy.get(source.billerId);
  if (annulledOn) return { kind: "annulled", label: `Anulada en ${getBillingMonthName(annulledOn)}` };

  const billedOn = source.receiverDocument ? context.billedInTarget.get(source.receiverDocument) : undefined;
  if (billedOn) return { kind: "billed", label: `Ya facturada el ${dayLabel(billedOn)}` };

  if (!source.items?.length) return { kind: "no_items", label: "Sin ítems en la copia de Biller" };
  return null;
};

// Con vencimiento es crédito (Biller no devuelve la forma de pago, ver
// docs/billing.md); lo que emite Bambú la guarda en paymentForm.
export const getPaymentForm = (source: Pick<RepeatSource, "dueDate" | "paymentForm">) =>
  source.paymentForm ?? (source.dueDate ? PAYMENT_FORM.CREDIT : PAYMENT_FORM.CASH);

export const getDueDays = (source: Pick<RepeatSource, "dueDate" | "issueDate">) =>
  source.dueDate && source.issueDate
    ? Math.max(0, Math.round((source.dueDate.getTime() - source.issueDate.getTime()) / DAY_MS))
    : null;

export const moveItemsMonth = (items: InvoiceItemPayload[], from: Date, to: Date) =>
  items.map((item) => ({
    ...item,
    concepto: moveMonthInText(item.concepto, from, to),
    descripcion: item.descripcion ? moveMonthInText(item.descripcion, from, to) : null,
  }));

export type RepeatDraftInvoice = {
  adenda: string | null;
  cfeType: number;
  currency: string;
  items: InvoiceItemPayload[];
  label: string | null;
  paymentForm: number;
  receiver: InvoiceReceiverPayload | null;
  receiverDocument: string | null;
  selected: boolean;
  sourceInvoiceId: string;
  total: number;
};

// El borrador del mes `to` a partir de lo emitido en `from`: mismo tipo,
// receptor, ítems con su indicador y adenda, a crédito (50); el mes del
// texto pasa al nuevo. Las ya facturadas, las anuladas y las notas van desmarcadas.
export const buildRepeatDraft = (sources: RepeatSource[], context: RepeatContext): RepeatDraftInvoice[] =>
  sources.filter(isRepeatSource).map((source) => {
    const items = moveItemsMonth(source.items ?? [], context.from, context.to);
    return {
      adenda: source.adenda ? moveMonthInText(source.adenda, context.from, context.to) : null,
      cfeType: source.cfeType,
      currency: source.currency,
      items,
      label: source.label ?? null,
      // Se factura a crédito, con vencimiento el 10 (feature 50): también las
      // que el mes pasado fueron de contado.
      paymentForm: PAYMENT_FORM.CREDIT,
      receiver: source.receiver,
      receiverDocument: source.receiverDocument,
      selected: getRepeatSkip(source, context) === null,
      sourceInvoiceId: source.id,
      total: getItemsTotal(items),
    };
  });

import { BillerError } from "@/lib/billing/biller-errors";
import type { BillerReader } from "@/lib/billing/biller-read";
import type { BillerInvoiceDetail } from "@/lib/billing/biller-schemas";
import { getSyncCreationWindow } from "@/lib/billing/billing-month";
import { toBillerInvoiceRecord, type BillerInvoiceRecord } from "@/lib/billing/invoice-mapping";

export type InvoiceSyncStore = {
  // Los que ya tienen ítems: su detalle no se vuelve a pedir.
  findDetailedBillerIds: (billerIds: number[]) => Promise<Set<number>>;
  upsertBillerInvoice: (record: BillerInvoiceRecord, syncedAt: Date) => Promise<"created" | "updated">;
};

export type InvoiceSyncResult = {
  created: number;
  detailErrors: number;
  detailsRead: number;
  fetched: number;
  updated: number;
  window: { from: string; to: string };
};

// Un detalle que Biller no encuentra o no se puede leer no frena el resto: la
// fila se guarda sin ítems y se reintenta en la próxima sincronización.
const readDetail = async (reader: BillerReader, id: number) => {
  try {
    return await reader.getInvoiceDetail(id);
  } catch (error) {
    if (error instanceof BillerError && (error.kind === "not_found" || error.kind === "invalid_response")) {
      return null;
    }
    throw error;
  }
};

// Copia a la base lo que Biller tiene alrededor de un mes (ver
// getSyncCreationWindow). Es idempotente: cada comprobante es una fila por su
// id de Biller, y correrla dos veces actualiza en vez de duplicar.
export const syncBillerPeriod = async (
  period: Date,
  deps: { now: Date; reader: BillerReader; store: InvoiceSyncStore }
): Promise<InvoiceSyncResult> => {
  const window = getSyncCreationWindow(period, deps.now);
  const rows = await deps.reader.listInvoices(window);
  const detailed = await deps.store.findDetailedBillerIds(rows.map((row) => row.id));
  const result: InvoiceSyncResult = { created: 0, detailErrors: 0, detailsRead: 0, fetched: rows.length, updated: 0, window };

  for (const row of rows) {
    let detail: BillerInvoiceDetail | undefined;
    if (!detailed.has(row.id)) {
      const read = await readDetail(deps.reader, row.id);
      if (read) {
        detail = read;
        result.detailsRead += 1;
      } else {
        result.detailErrors += 1;
      }
    }
    const outcome = await deps.store.upsertBillerInvoice(toBillerInvoiceRecord(row, detail), deps.now);
    result[outcome] += 1;
  }

  return result;
};

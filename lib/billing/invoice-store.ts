import { Prisma, type PrismaClient } from "@prisma/client";

import type { InvoiceSyncStore } from "@/lib/billing/invoice-sync-core";
import type { BillerInvoiceRecord } from "@/lib/billing/invoice-mapping";

const json = (value: unknown) => (value === null || value === undefined ? Prisma.DbNull : (value as Prisma.InputJsonValue));

// Lo que puede cambiar en Biller después de emitir: el estado ante DGI. Los
// datos del comprobante no cambian, pero se reescriben por si una lectura
// anterior quedó incompleta.
const toUpdate = (record: BillerInvoiceRecord, syncedAt: Date): Prisma.InvoiceUpdateInput => ({
  billerId: record.billerId,
  status: record.status,
  billerStatus: record.billerStatus,
  cfeType: record.cfeType,
  period: record.period,
  issueDate: record.issueDate,
  dueDate: record.dueDate,
  currency: record.currency,
  total: record.total,
  receiver: json(record.receiver),
  receiverDocument: record.receiverDocument,
  adenda: record.adenda,
  purchaseOrder: record.purchaseOrder,
  billerSucursal: record.billerSucursal,
  series: record.series,
  number: record.number,
  cae: json(record.cae),
  billerCreatedAt: record.billerCreatedAt,
  syncedAt,
  ...(record.detail
    ? {
        items: json(record.detail.items),
        references: json(record.detail.references),
        referenceIds: record.detail.referenceIds,
      }
    : {}),
});

const toCreate = (record: BillerInvoiceRecord, syncedAt: Date): Prisma.InvoiceCreateInput => ({
  ...(toUpdate(record, syncedAt) as Prisma.InvoiceCreateInput),
  origin: "BILLER",
  internalNumber: record.internalNumber,
});

// Una fila de Biller se busca por su id o por su numero_interno: una factura
// que emitió Bambú y quedó sin respuesta (UNKNOWN) se reconcilia así.
export const createInvoiceSyncStore = (db: PrismaClient): InvoiceSyncStore => ({
  findDetailedBillerIds: async (billerIds) => {
    if (!billerIds.length) return new Set();
    const rows = await db.invoice.findMany({
      where: { billerId: { in: billerIds }, items: { not: Prisma.DbNull } },
      select: { billerId: true },
    });
    return new Set(rows.flatMap((row) => (row.billerId === null ? [] : [row.billerId])));
  },

  upsertBillerInvoice: async (record, syncedAt) => {
    const match = await db.invoice.findFirst({
      where: {
        OR: [
          { billerId: record.billerId },
          ...(record.internalNumber ? [{ internalNumber: record.internalNumber }] : []),
        ],
      },
      select: { id: true },
    });
    if (match) {
      await db.invoice.update({ where: { id: match.id }, data: toUpdate(record, syncedAt) });
      return "updated";
    }
    try {
      await db.invoice.create({ data: toCreate(record, syncedAt) });
      return "created";
    } catch (error) {
      // Otra sincronización la creó en el medio: se actualiza la suya.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        await db.invoice.update({ where: { billerId: record.billerId }, data: toUpdate(record, syncedAt) });
        return "updated";
      }
      throw error;
    }
  },
});

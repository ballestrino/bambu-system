import { Prisma } from "@prisma/client";

import { readStoredItems } from "@/lib/billing/invoice-json";

type Reader = Pick<Prisma.TransactionClient, "invoice">;

const ISSUED = ["ISSUED", "ACCEPTED", "UNKNOWN"] as const;

// El indicador de IVA de la última factura emitida: el de una factura nueva
// (16 si la empresa es de IVA mínimo, 3 si cobra la tasa básica).
export const getLastIndicator = async (db: Reader) => {
  const last = await db.invoice.findFirst({
    where: { cfeType: { in: [101, 111] }, items: { not: Prisma.DbNull }, status: { in: [...ISSUED] } },
    orderBy: [{ issueDate: "desc" }, { number: "desc" }],
    select: { items: true },
  });
  return readStoredItems(last?.items)?.[0]?.indicador_facturacion ?? null;
};

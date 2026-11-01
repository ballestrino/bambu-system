import "server-only";

import { Prisma } from "@prisma/client";

import { groupBillingClients, toClientSearch } from "@/lib/billing/billing-clients";
import { readStoredReceiver } from "@/lib/billing/invoice-json";
import { db } from "@/lib/db";

const ROW_LIMIT = 120;

type Row = { id: string; cfeType: number; issueDate: Date | null; receiver: unknown; total: string };

// Los receptores de las facturas copiadas de Biller y de las que emitió Bambú,
// por nombre, nombre de fantasía o documento, uno por documento con su última
// factura (feature 45). Sin sesión: la piden "Buscar cliente" (solo admin) y
// el agente de Nueva factura (su ruta es solo admin).
export const findBillingClients = async (query: string, limit: number) => {
  const search = toClientSearch(query);
  if (!search.text && !search.digits) return [];
  const conditions: Prisma.Sql[] = [];
  if (search.text) {
    const like = `%${search.text}%`;
    conditions.push(Prisma.sql`"receiver"->>'razon_social' ILIKE ${like}`, Prisma.sql`"receiver"->>'nombre_fantasia' ILIKE ${like}`);
  }
  if (search.digits) conditions.push(Prisma.sql`"receiverDocument" LIKE ${`%${search.digits}%`}`);
  const rows = await db.$queryRaw<Row[]>`
    SELECT "id", "cfeType", "issueDate", "receiver", "total"::text AS "total"
    FROM "Invoice"
    WHERE "receiver" IS NOT NULL AND "cfeType" IN (101, 111) AND "status" <> 'DRAFT'
      AND (${Prisma.join(conditions, " OR ")})
    ORDER BY "issueDate" DESC NULLS LAST, "createdAt" DESC
    LIMIT ${ROW_LIMIT}`;
  return groupBillingClients(
    rows.map((row) => ({ id: row.id, cfeType: row.cfeType, issueDate: row.issueDate, receiver: readStoredReceiver(row.receiver), total: Number(row.total) })),
    limit
  );
};

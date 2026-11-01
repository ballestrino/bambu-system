"use server";

import { Prisma } from "@prisma/client";

import { describeBillerError } from "@/lib/billing/biller-errors";
import { getBillerReader } from "@/lib/billing/biller-server";
import { groupBillingClients, toClientSearch } from "@/lib/billing/billing-clients";
import { readStoredReceiver } from "@/lib/billing/invoice-json";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";

const CLIENT_LIMIT = 8;
const ROW_LIMIT = 120;

type Row = { cfeType: number; issueDate: Date | null; receiver: unknown; total: string };

// "Buscar cliente" de Nueva factura (feature 45): los receptores de las
// facturas copiadas de Biller y de las que emitió Bambú, por nombre, nombre
// de fantasía o documento, uno por documento con su última factura.
export const searchBillingClients = async (query: unknown) => {
  try {
    await requireAdminSession();
    const search = toClientSearch(typeof query === "string" ? query : "");
    if (!search.text && !search.digits) return { clients: [] };
    const conditions: Prisma.Sql[] = [];
    if (search.text) {
      const like = `%${search.text}%`;
      conditions.push(Prisma.sql`"receiver"->>'razon_social' ILIKE ${like}`, Prisma.sql`"receiver"->>'nombre_fantasia' ILIKE ${like}`);
    }
    if (search.digits) conditions.push(Prisma.sql`"receiverDocument" LIKE ${`%${search.digits}%`}`);
    const rows = await db.$queryRaw<Row[]>`
      SELECT "cfeType", "issueDate", "receiver", "total"::text AS "total"
      FROM "Invoice"
      WHERE "receiver" IS NOT NULL AND "cfeType" IN (101, 111) AND "status" <> 'DRAFT'
        AND (${Prisma.join(conditions, " OR ")})
      ORDER BY "issueDate" DESC NULLS LAST, "createdAt" DESC
      LIMIT ${ROW_LIMIT}`;
    const clients = groupBillingClients(
      rows.map((row) => ({ cfeType: row.cfeType, issueDate: row.issueDate, receiver: readStoredReceiver(row.receiver), total: Number(row.total) })),
      CLIENT_LIMIT
    );
    return { clients };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { clients: [], error: error.message };
    console.error("Error searching billing clients:", error);
    return { clients: [], error: "No se pudo buscar el cliente" };
  }
};

// "Consultar DGI": razón social y domicilio fiscal de un RUT, por Biller.
export const lookupBillingRut = async (rut: unknown) => {
  try {
    await requireAdminSession();
    const digits = typeof rut === "string" ? rut.replace(/\D/g, "") : "";
    if (digits.length !== 12) return { error: "El RUT tiene 12 dígitos" };
    const data = await getBillerReader().lookupRut(digits);
    if (!data.name) return { error: "DGI no devolvió una razón social para ese RUT" };
    return { data };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    return { error: describeBillerError(error) };
  }
};

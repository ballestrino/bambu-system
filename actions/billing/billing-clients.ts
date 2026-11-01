"use server";

import { findBillingClients } from "@/data/billing/clients";
import { describeBillerError } from "@/lib/billing/biller-errors";
import { getBillerReader } from "@/lib/billing/biller-server";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";

const CLIENT_LIMIT = 8;

// "Buscar cliente" de Nueva factura (feature 45): los receptores de las
// facturas copiadas de Biller y de las que emitió Bambú, por nombre, nombre
// de fantasía o documento, uno por documento con su última factura.
export const searchBillingClients = async (query: unknown) => {
  try {
    await requireAdminSession();
    const clients = await findBillingClients(typeof query === "string" ? query : "", CLIENT_LIMIT);
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

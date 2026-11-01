import type { BillerGet } from "@/lib/billing/biller-http";
import { BillerError } from "@/lib/billing/biller-errors";
import {
  billerEntitySchema,
  billerInvoiceDetailSchema,
  billerInvoiceListSchema,
  type BillerInvoice,
  type BillerInvoiceDetail,
} from "@/lib/billing/biller-schemas";

export type BillerRutData = {
  address: string | null;
  city: string | null;
  department: string | null;
  name: string | null;
  rut: string | null;
};

export type BillerReader = {
  // numero_interno es único en Biller. obtener toma como desde el día de hoy
  // si no se le pasa, así que se manda la ventana de creación.
  findByInternalNumber: (internalNumber: string, window: { from: string; to: string }) => Promise<BillerInvoice | null>;
  getInvoiceDetail: (id: number) => Promise<BillerInvoiceDetail>;
  // Fechas de creación en hora de Montevideo, "aaaa-mm-dd hh:mm:ss".
  listInvoices: (window: { from: string; to: string }) => Promise<BillerInvoice[]>;
  lookupRut: (rut: string) => Promise<BillerRutData>;
};

const parseOrThrow = <T>(
  schema: { safeParse: (value: unknown) => { success: true; data: T } | { success: false } },
  value: unknown,
  what: string
) => {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new BillerError("invalid_response", `Biller devolvió ${what} con un formato inesperado`);
  }
  return parsed.data;
};

export const createBillerReader = (get: BillerGet): BillerReader => ({
  findByInternalNumber: async (internalNumber, { from, to }) => {
    const rows = parseOrThrow(
      billerInvoiceListSchema,
      await get("/v2/comprobantes/obtener", { desde: from, hasta: to, numero_interno: internalNumber }),
      "la lista de comprobantes"
    );
    return rows.find((row) => row.numero_interno === internalNumber) ?? null;
  },

  getInvoiceDetail: async (id) =>
    parseOrThrow(billerInvoiceDetailSchema, await get("/v3/comprobantes/detalle", { id }), "un comprobante"),

  listInvoices: async ({ from, to }) =>
    parseOrThrow(
      billerInvoiceListSchema,
      await get("/v2/comprobantes/obtener", { desde: from, hasta: to }),
      "la lista de comprobantes"
    ),

  lookupRut: async (rut) => {
    const entity = parseOrThrow(
      billerEntitySchema,
      await get("/v2/dgi/empresas/datos-entidad", { rut: rut.replace(/\D/g, "") }),
      "los datos del RUT"
    );
    const domicile = entity.WS_DomicilioFiscalPrincipal;
    const street = [domicile?.Calle_Nom, domicile?.Dom_Pta_Nro].filter(Boolean).join(" ");
    return {
      address: street || null,
      city: domicile?.Loc_Nom ?? null,
      department: domicile?.Dpto_Nom ?? null,
      name: entity.RazonSocial,
      rut: entity.RUC,
    };
  },
});

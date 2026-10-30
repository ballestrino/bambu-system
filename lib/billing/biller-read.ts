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

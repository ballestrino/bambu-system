import type { InvoiceItemPayload } from "@/lib/billing/invoice-mapping";

// IVA por indicador de facturación de DGI: 2 tasa mínima, 3 tasa básica. Los
// demás (exento, IVA mínimo de Literal E con el 16, no facturable…) no suman
// IVA. Un borrador calcula su total así; lo emitido usa el total de Biller.
const TAX_RATES: Record<number, number> = { 2: 0.1, 3: 0.22 };

export const getTaxRate = (indicator: number) => TAX_RATES[indicator] ?? 0;

const round = (amount: number) => Math.round(amount * 100) / 100;

// Cantidad por precio, menos el descuento y más el recargo de la línea ($ o %).
export const getLineSubtotal = (item: InvoiceItemPayload) => {
  const gross = item.cantidad * item.precio;
  const adjust = (kind: string | undefined, amount: number | undefined) =>
    !amount ? 0 : kind === "%" ? (gross * amount) / 100 : amount;
  return round(gross - adjust(item.descuento_tipo, item.descuento_cantidad) + adjust(item.recargo_tipo, item.recargo_cantidad));
};

export const getItemsSubtotal = (items: InvoiceItemPayload[]) =>
  round(items.reduce((sum, item) => sum + getLineSubtotal(item), 0));

export const getItemsTotal = (items: InvoiceItemPayload[]) =>
  round(items.reduce((sum, item) => sum + getLineSubtotal(item) * (1 + getTaxRate(item.indicador_facturacion)), 0));

export const hasTaxedItems = (items: InvoiceItemPayload[]) =>
  items.some((item) => getTaxRate(item.indicador_facturacion) > 0);

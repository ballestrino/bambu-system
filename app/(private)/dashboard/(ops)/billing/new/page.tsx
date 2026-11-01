import { NewInvoicePage } from "@/components/billing/new-invoice/new-invoice-page";
import { getNewInvoiceView } from "@/data/billing/new-invoice";

// Emitir espera la respuesta de Biller (y una búsqueda por número interno si
// la respuesta no es clara): hasta ~100 s.
export const maxDuration = 120;

// Nueva factura (docs/billing.md, feature 45). Solo admin: la lectura y las
// acciones vuelven a pedir la sesión. ?month=AAAA-MM es el mes del borrador
// donde se puede guardar (el del selector de Facturación).
export default async function Page({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const view = await getNewInvoiceView(month);
  return <NewInvoicePage view={view} />;
}

import type { InvoiceReceiverPayload } from "@/lib/billing/invoice-mapping";

// Un cliente para "Buscar cliente" en Nueva factura (feature 45): el receptor
// de su última factura, con qué se le facturó por última vez.
export type BillingClient = {
  key: string;
  lastCfeType: number;
  lastIssueDate: string | null;
  lastTotal: number;
  receiver: InvoiceReceiverPayload;
};

export type BillingClientRow = {
  cfeType: number;
  issueDate: Date | null;
  receiver: InvoiceReceiverPayload | null;
  total: number;
};

const normalize = (value: string) => value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();

// Un cliente por documento (o por nombre si no tiene), con los datos de la
// factura más nueva. Las filas llegan de la más nueva a la más vieja.
export const groupBillingClients = (rows: BillingClientRow[], limit: number): BillingClient[] => {
  const clients = new Map<string, BillingClient>();
  for (const row of rows) {
    const receiver = row.receiver;
    const name = receiver?.razon_social || receiver?.nombre_fantasia;
    if (!receiver || !name) continue;
    const key = receiver.documento?.replace(/\D/g, "") || `nombre:${normalize(name)}`;
    if (clients.has(key)) continue;
    clients.set(key, {
      key,
      lastCfeType: row.cfeType,
      lastIssueDate: row.issueDate ? row.issueDate.toISOString().slice(0, 10) : null,
      lastTotal: row.total,
      receiver,
    });
    if (clients.size >= limit) break;
  }
  return [...clients.values()];
};

// Lo que se busca con LIKE: el texto sin comodines y, si trae números, los
// dígitos para el documento.
export const toClientSearch = (query: string) => {
  const text = query.trim().replace(/[%_\\]/g, "").slice(0, 60);
  const digits = text.replace(/\D/g, "");
  return { digits: digits.length >= 3 ? digits : null, text: text.length >= 2 ? text : null };
};

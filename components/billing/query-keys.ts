export const billingQueryKeys = {
  root: ["billing"] as const,
  month: (periodKey: string) => ["billing", "month", periodKey] as const,
  sync: (periodKey: string) => ["billing", "sync", periodKey] as const,
  draftRowMutation: ["billing", "draft-row"] as const,
  draftInvoice: (invoiceId: string) => ["billing", "draft-invoice", invoiceId] as const,
  clients: (query: string) => ["billing", "clients", query] as const,
};

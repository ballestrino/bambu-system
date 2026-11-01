"use server";

import { lookupBillingRut, searchBillingClients } from "@/actions/billing/billing-clients";
import { issueNewInvoice, saveNewInvoiceToDraft } from "@/actions/billing/new-invoice";

export type NewInvoiceResult = { batchId?: string; error?: string; invoiceId?: string; success?: string; unknown?: boolean };

// Envoltorios de Nueva factura (45). Devuelven el { error } en vez de tirarlo:
// en producción Next oculta el mensaje de un error tirado en una server
// action. Los hooks lo convierten en error del lado del cliente.
export const issueNewInvoiceAction = async (values: unknown): Promise<NewInvoiceResult> => issueNewInvoice(values);

export const saveNewInvoiceToDraftAction = async (values: unknown): Promise<NewInvoiceResult> => saveNewInvoiceToDraft(values);

export const searchBillingClientsAction = async (query: string) => searchBillingClients(query);

export const lookupBillingRutAction = async (rut: string) => lookupBillingRut(rut);

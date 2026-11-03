"use server";

import { deleteInvoiceDelivery, recordInvoiceDelivery } from "@/actions/billing/invoice-delivery";
import { sendInvoiceEmail } from "@/actions/billing/invoice-send";
import type { InvoiceDeliveryAdd, InvoiceDeliveryRemove, InvoiceSendRequest } from "@/schemas/billing-delivery";

// Envoltorios de enviar y del registro de envíos (feature 53). Devuelven el
// { error } y lo tira el hook: en producción Next oculta el mensaje de un
// error tirado dentro de una server action.
export const sendInvoiceEmailAction = async (values: InvoiceSendRequest) => sendInvoiceEmail(values);

export const recordInvoiceDeliveryAction = async (values: InvoiceDeliveryAdd) => recordInvoiceDelivery(values);

export const deleteInvoiceDeliveryAction = async (values: InvoiceDeliveryRemove) => deleteInvoiceDelivery(values);

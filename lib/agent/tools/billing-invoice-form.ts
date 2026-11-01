import "server-only";

import { tool } from "ai";

import { findBillingClients } from "@/data/billing/clients";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { hideFromModel, runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { describeBillerError } from "@/lib/billing/biller-errors";
import { getBillerReader, getBillerStatus } from "@/lib/billing/biller-server";
import { getNewInvoiceProblems, getNewInvoiceTotals, type NewInvoiceForm } from "@/lib/billing/new-invoice";
import { CFE_LABELS } from "@/lib/billing/new-invoice-agent-context";
import { planInvoiceFormFill, receiverToNewInvoiceForm, rutToNewInvoiceForm } from "@/lib/billing/new-invoice-agent-fill";
import { fillInvoiceFormInputSchema, findBillingClientInputSchema } from "@/schemas/agent-invoice-form-tools";

const CLIENT_LIMIT = 8;
const NO_FORM = "Esto solo funciona dentro de Nueva factura (Facturación → Nueva factura). Pedile al usuario que la abra.";

// Los datos de un cliente por su documento: su última factura (copiada de
// Biller o emitida por Bambú) o, si es un RUT que no tiene facturas, DGI.
const findClientByDocument = async (document: string): Promise<{ label: string; fields: Partial<NewInvoiceForm> } | { error: string }> => {
  const digits = document.replace(/\D/g, "");
  const clients = await findBillingClients(digits, CLIENT_LIMIT);
  const match = clients.find((client) => client.receiver.documento?.replace(/\D/g, "") === digits);
  if (match) return { fields: receiverToNewInvoiceForm(match.receiver), label: "de su última factura" };
  if (digits.length !== 12) return { error: `No encontré facturas con el documento ${document}. Buscalo con findBillingClient o pedile los datos al usuario.` };
  const status = getBillerStatus();
  if (!status.configured) return { error: status.message ?? "Biller no está configurado: no se puede consultar el RUT." };
  try {
    const data = await getBillerReader().lookupRut(digits);
    if (!data.name) return { error: "DGI no devolvió una razón social para ese RUT." };
    return { fields: rutToNewInvoiceForm(digits, data), label: "datos de DGI" };
  } catch (error) {
    return { error: describeBillerError(error) };
  }
};

// El agente dentro de Nueva factura (feature 46, docs/billing.md). Ninguna
// escribe en la base ni en Biller: fillInvoiceForm devuelve los campos que
// cambian y la página los pone en el formulario. Emitir o guardar en el
// borrador lo hace la persona con los botones de la página.
export const createInvoiceFormTools = (ctx: AgentToolContext) => ({
  findBillingClient: tool({
    description:
      "Busca clientes en las facturas ya emitidas (Biller y Bambú) por razón social, nombre de fantasía o documento: sus datos, la última factura (id para getInvoice, fecha, tipo y total).",
    inputSchema: findBillingClientInputSchema,
    execute: (input) =>
      runTool("findBillingClient", async () => {
        const clients = await findBillingClients(input.query, CLIENT_LIMIT);
        const rows = clients.map((client) => ({
          name: client.receiver.razon_social || client.receiver.nombre_fantasia,
          tradeName: client.receiver.nombre_fantasia,
          document: client.receiver.documento,
          address: [client.receiver.sucursal.direccion, client.receiver.sucursal.ciudad, client.receiver.sucursal.departamento].filter(Boolean).join(", ") || null,
          lastInvoiceId: client.lastInvoiceId,
          lastIssueDate: client.lastIssueDate,
          lastCfe: client.lastCfeType === 111 ? "e-Factura" : "e-Ticket",
          total: client.lastTotal,
        }));
        return toolOk({
          card: "list" as const,
          kind: "billingClients",
          total: rows.length,
          truncated: rows.length >= CLIENT_LIMIT,
          rows,
          grounding: { amounts: rows.map((row) => row.total) },
        });
      }),
  }),

  fillInvoiceForm: tool({
    description:
      "Completa el formulario de Nueva factura que el usuario tiene abierto: tipo, fecha, contado o crédito, moneda, cliente (por documento: su última factura o DGI; o escrito), ítems sin IVA y adenda. Cada campo null no cambia. No emite ni guarda: el usuario revisa y toca Emitir ahora o Guardar en el borrador.",
    inputSchema: fillInvoiceFormInputSchema,
    toModelOutput: hideFromModel("patch"),
    execute: (input) =>
      runTool("fillInvoiceForm", async () => {
        const holder = ctx.invoiceForm;
        if (!holder) return toolError("no_form", NO_FORM);
        let found: { label: string; fields: Partial<NewInvoiceForm> } | null = null;
        if (input.clientDocument) {
          const result = await findClientByDocument(input.clientDocument);
          if ("error" in result) return toolError("client_not_found", result.error);
          found = result;
        }
        const plan = planInvoiceFormFill(holder.current, input, found);
        holder.current = plan.form;
        const totals = getNewInvoiceTotals(plan.form);
        const form = plan.form;
        return toolOk({
          card: "invoice-form" as const,
          patch: plan.patch,
          changes: plan.changes,
          cfe: CFE_LABELS[form.cfeType],
          client: form.cfeType === 101 && form.consumer ? "Consumidor final" : form.name || null,
          currency: form.currency,
          subtotal: totals.subtotal,
          taxes: totals.taxes,
          total: totals.total,
          problems: getNewInvoiceProblems(form, holder.today),
          grounding: { amounts: [totals.subtotal, totals.total, ...totals.taxes.map((tax) => tax.amount)] },
        });
      }),
  }),
});

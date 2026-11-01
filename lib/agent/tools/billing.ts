import "server-only";

import { tool } from "ai";

import { getBillingInvoice } from "@/data/billing/invoice";
import { getBillingMonthView, type BillingMonthView } from "@/data/billing/month";
import { formatMonthLabel } from "@/lib/agent/month";
import { resolveBillingMonth, syncBillingMonthOnce } from "@/lib/agent/tools/billing-shared";
import type { AgentToolContext } from "@/lib/agent/tools/context";
import { runTool, toolError, toolOk } from "@/lib/agent/tool-result";
import { describeBillerError } from "@/lib/billing/biller-errors";
import { getBillerReader, getBillerStatus } from "@/lib/billing/biller-server";
import {
  billingMonthInputSchema,
  getInvoiceInputSchema,
  listInvoicesInputSchema,
  lookupRutInputSchema,
} from "@/schemas/agent-billing-tools";

const MAX_ROWS = 60;

const normalize = (value: string) =>
  value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// El mes con la copia de Biller al día (si responde) y su vista, la misma de
// la página: los números del agente son los de la pantalla.
const readMonth = async (ctx: AgentToolContext, month: string | null) => {
  const key = resolveBillingMonth(ctx, month);
  const warning = getBillerStatus().configured ? await syncBillingMonthOnce(key) : null;
  const view = await getBillingMonthView(key);
  if (typeof view.error === "string") return { error: view.error, ok: false as const };
  return { key, ok: true as const, view: view as BillingMonthView, warning };
};

type DraftRow = NonNullable<BillingMonthView["draft"]>["rows"][number];

const draftRowState = (row: DraftRow) => {
  if (row.status === "DRAFT") return row.selected ? "Borrador, marcada: sale al emitir" : "Borrador, desmarcada: no sale";
  if (row.status === "ISSUING") return "Emitiéndose: no se cambia";
  const number = row.series ? ` ${row.series} ${row.number}` : "";
  if (row.status === "UNKNOWN") return `Emisión sin confirmar${number}: no se cambia`;
  return `Ya emitida${number} (${row.billerStatus ?? row.status}): no se cambia`;
};

const draftTotals = (view: BillingMonthView) => {
  const marked = view.draft?.rows.filter((row) => row.status === "DRAFT" && row.selected) ?? [];
  return {
    count: marked.length,
    subtotal: Math.round(marked.reduce((sum, row) => sum + row.subtotal, 0) * 100) / 100,
    total: Math.round(marked.reduce((sum, row) => sum + row.total, 0) * 100) / 100,
  };
};

// Lecturas de Facturación (docs/billing.md, "Agente"). Ninguna escribe en
// Biller: la copia local se actualiza con GET y emitir no está acá.
export const createBillingTools = (ctx: AgentToolContext) => ({
  getBillingSummary: tool({
    description:
      "Resumen de facturación de un mes, como la página Facturación: facturado neto (facturas menos notas de crédito), facturas emitidas por tipo, notas de crédito, pendientes y rechazadas ante DGI, contra el mes anterior, y el estado del borrador del mes.",
    inputSchema: billingMonthInputSchema,
    execute: (input) =>
      runTool("getBillingSummary", async () => {
        const month = await readMonth(ctx, input.month);
        if (!month.ok) return toolError("invalid_month", month.error);
        const { current, previous } = month.view.summary;
        const draft = month.view.draft;
        const totals = draftTotals(month.view);
        return toolOk({
          card: "billing-summary" as const,
          month: month.key,
          monthLabel: formatMonthLabel(month.key),
          environment: month.view.biller.environment,
          current,
          previous: { invoiceCount: previous.invoiceCount, net: previous.net },
          draft: draft
            ? { batchId: draft.id, status: draft.status, rows: draft.rows.length, ...totals }
            : null,
          repeatPreview: month.view.repeatPreview,
          warning: month.warning,
          grounding: {
            amounts: [current.net, current.invoicesTotal, current.creditNotesTotal, previous.net, current.net - previous.net, totals.subtotal, totals.total],
          },
        });
      }),
  }),

  listInvoices: tool({
    description:
      "Facturas de un mes con su id: lo emitido (receptor, tipo, serie y número, total, estado ante DGI, si está anulada) y el borrador (state dice si sale al emitir, está desmarcada o ya se emitió; cada línea con su index, detalle y precio sin IVA, y el monto del mes pasado). Usalo antes de cambiar el borrador.",
    inputSchema: listInvoicesInputSchema,
    execute: (input) =>
      runTool("listInvoices", async () => {
        const month = await readMonth(ctx, input.month);
        if (!month.ok) return toolError("invalid_month", month.error);
        const which = input.which ?? "both";
        const query = input.query ? normalize(input.query) : null;
        const matches = (name: string) => !query || normalize(name).includes(query);

        const issued = which === "draft" ? [] : month.view.issued.filter((row) => matches(row.name)).map((row) => ({
          section: "issued", id: row.id, name: row.name, cfe: row.cfeLabel, number: row.series ? `${row.series}-${row.number}` : null,
          issueDate: row.issueDate, total: row.total, status: row.billerStatus ?? row.status, annulled: row.annulled,
        }));
        // Una fila del borrador ya emitida no está "marcada": está emitida y
        // no se cambia. En la prueba real el modelo leyó selected en las emitidas.
        const draft = which === "issued" ? [] : (month.view.draft?.rows ?? []).filter((row) => matches(row.name)).map((row) => ({
          section: "draft", id: row.id, name: row.name, cfe: row.cfeLabel, status: row.status, state: draftRowState(row),
          selected: row.status === "DRAFT" ? row.selected : null, skip: row.status === "DRAFT" ? row.skip?.label ?? null : null,
          error: row.error, payment: row.paymentLabel,
          subtotal: row.subtotal, previousSubtotal: row.prevSubtotal, total: row.total,
          lines: row.lines.map((line, index) => ({ index, concepto: line.concepto, cantidad: line.cantidad, precio: line.precio, previousPrecio: line.prevPrecio })),
        }));
        const rows = [...draft, ...issued];
        return toolOk({
          card: "list" as const,
          kind: "invoices",
          month: formatMonthLabel(month.key),
          draftStatus: month.view.draft?.status ?? null,
          total: rows.length,
          truncated: rows.length > MAX_ROWS,
          rows: rows.slice(0, MAX_ROWS),
          warnings: month.warning ? [month.warning] : [],
          grounding: {
            amounts: rows.slice(0, MAX_ROWS).flatMap((row) => [
              row.total,
              ...("subtotal" in row ? [row.subtotal, row.previousSubtotal ?? 0, ...row.lines.map((line) => line.precio)] : []),
            ]),
          },
        });
      }),
  }),

  getInvoice: tool({
    description:
      "Una factura entera por su id (de listInvoices): receptor, líneas con indicador de IVA, totales, estado ante DGI, forma de pago, adenda y las notas de crédito que la corrigen.",
    inputSchema: getInvoiceInputSchema,
    execute: (input) =>
      runTool("getInvoice", async () => {
        const invoice = await getBillingInvoice(input.invoiceId);
        if (!invoice) return toolError("not_found", "No encontré esa factura. Buscala con listInvoices.");
        return toolOk({
          card: "billing-invoice" as const,
          ...invoice,
          grounding: { amounts: [invoice.total, invoice.subtotal ?? 0, ...(invoice.lines ?? []).flatMap((line) => [line.precio, line.subtotal])] },
        });
      }),
  }),

  lookupRut: tool({
    description:
      "Consulta un RUT en DGI (por Biller): razón social y domicilio fiscal. Usalo antes de sumar una factura para un cliente nuevo.",
    inputSchema: lookupRutInputSchema,
    execute: (input) =>
      runTool("lookupRut", async () => {
        const status = getBillerStatus();
        if (!status.configured) return toolError("not_configured", status.message ?? "Biller no está configurado.");
        try {
          const data = await getBillerReader().lookupRut(input.rut);
          return toolOk({
            card: "rut" as const,
            requested: input.rut.replace(/\D/g, ""),
            ...data,
            // En test DGI devuelve siempre la misma entidad de prueba.
            note: status.environment === "test" ? "Biller test devuelve siempre la misma entidad de prueba, sea cual sea el RUT." : null,
          });
        } catch (error) {
          return toolError("lookup_failed", describeBillerError(error));
        }
      }),
  }),
});

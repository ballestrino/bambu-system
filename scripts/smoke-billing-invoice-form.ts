import "dotenv/config";

import assert from "node:assert/strict";

import { PrismaClient } from "@prisma/client";

import { resolveBudgetContext } from "../lib/agent/context";
import { createGrounding } from "../lib/agent/grounding";
import { createInvoiceFormTools } from "../lib/agent/tools/billing-invoice-form";
import type { AgentToolContext } from "../lib/agent/tools/context";
import { createUsageCollector } from "../lib/agent/usage-collector";
import { emptyNewInvoiceItem, newInvoiceDefaults } from "../lib/billing/new-invoice";

// Smoke de la 46 contra la base de DATABASE_URL, sin modelo y sin Biller: el
// contexto de Nueva factura, findBillingClient sobre una factura emitida de
// prueba y fillInvoiceForm (cliente por documento, ítems, crédito, una
// segunda llamada sobre la primera y sin formulario). No escribe facturas
// salvo la de prueba, que borra al final. No emite.
// Uso: pnpm exec tsx --require ./scripts/server-only-stub.cjs scripts/smoke-billing-invoice-form.ts
const db = new PrismaClient();
const DOCUMENT = "219876540017";
const options = { messages: [], toolCallId: "smoke" } as never;
// execute puede devolver un stream; estas tools devuelven un resultado.
const settle = async <T>(value: T) => (await value) as Exclude<Awaited<T>, AsyncIterable<unknown>>;

const run = async () => {
  const before = await db.invoice.count();
  const seeded = await db.invoice.create({
    data: {
      origin: "BILLER", status: "ACCEPTED", cfeType: 111, period: new Date("2026-10-01T00:00:00Z"), issueDate: new Date("2026-10-05T00:00:00Z"),
      total: 12200, receiverDocument: DOCUMENT, billerId: 987654321, series: "A", number: 99,
      receiver: { tipo_documento: 2, documento: DOCUMENT, razon_social: "Smoke Los Pinos S.A.", nombre_fantasia: "Smoke Pinos",
        sucursal: { direccion: "Av. Italia 1234", ciudad: "Montevideo", departamento: "Montevideo", pais: "UY" } },
      items: [{ cantidad: 1, codigo: null, concepto: "Limpieza octubre 2026", descripcion: null, indicador_facturacion: 3, precio: 10000, unidad_medida: null }],
    },
  });
  try {
    // El contexto: el formulario de la página (con un ítem a medio escribir) entra como conversación de Facturación.
    const form = { ...newInvoiceDefaults("2026-11-20", 3), items: [{ ...emptyNewInvoiceItem(3), concepto: "Algo", cantidad: 5 }] };
    const context = await resolveBudgetContext({ kind: "new-invoice", month: "2026-11", form });
    assert.equal(context.kind, "billing");
    assert.equal(context.billingMonth, "2026-11");
    assert.ok(context.invoiceForm && context.invoiceForm.current.items.length === 1);
    assert.match(context.text ?? "", /Nueva factura/);
    console.log("contexto:\n" + context.text);

    const ctx: AgentToolContext = {
      actorId: "smoke", conversationId: "smoke", mode: "alto", budgetId: null, formValues: null, billingMonth: "2026-11",
      invoiceForm: context.invoiceForm, grounding: createGrounding(), usage: createUsageCollector(), teamContext: null,
    };
    const tools = createInvoiceFormTools(ctx);

    const found = await settle(tools.findBillingClient.execute!({ query: "pinos" }, options));
    assert.ok(found.ok);
    const row = found.data.rows.find((item) => item.document === DOCUMENT);
    assert.equal(row?.lastInvoiceId, seeded.id);
    console.log("findBillingClient:", row);

    const none = { cfeType: null, issueDate: null, payment: null, creditDays: null, currency: null, purchaseOrder: null, clientDocument: null, consumer: null, client: null, items: null, adenda: null };
    const first = await settle(tools.fillInvoiceForm.execute!({
      ...none, clientDocument: DOCUMENT, payment: "credito", creditDays: 30,
      items: [{ concepto: "Limpieza noviembre 2026", cantidad: null, precio: 10000, unidad: null, indicador: null, descripcion: null }],
    }, options));
    assert.ok(first.ok);
    assert.equal(first.data.client, "Smoke Los Pinos S.A.");
    assert.equal(first.data.total, 12200);
    assert.deepEqual(first.data.problems, []);
    console.log("fillInvoiceForm 1:", first.data.changes, first.data.patch);

    const second = await settle(tools.fillInvoiceForm.execute!({ ...none, adenda: "Servicio de noviembre" }, options));
    assert.ok(second.ok);
    assert.deepEqual(Object.keys(second.data.patch), ["adenda"]);
    assert.equal(second.data.client, "Smoke Los Pinos S.A.");

    const unknown = await settle(tools.fillInvoiceForm.execute!({ ...none, clientDocument: "1234567" }, options));
    assert.ok(!unknown.ok && unknown.error.code === "client_not_found");

    const outside = await settle(createInvoiceFormTools({ ...ctx, invoiceForm: null }).fillInvoiceForm.execute!(none, options));
    assert.ok(!outside.ok && outside.error.code === "no_form");
    // Ninguna llamada escribió facturas.
    assert.equal(await db.invoice.count(), before + 1);
    console.log("smoke-billing-invoice-form OK");
  } finally {
    await db.invoice.delete({ where: { id: seeded.id } });
    await db.$disconnect();
  }
};

void run().catch((error) => {
  console.error(error);
  process.exit(1);
});

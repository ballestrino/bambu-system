import "dotenv/config";

import { resolveBillerConfig } from "../lib/billing/biller-config";
import { createBillerGet } from "../lib/billing/biller-http";
import { createBillerIssuer } from "../lib/billing/biller-issue";
import { createBillerReader } from "../lib/billing/biller-read";
import { getLookupCreationWindow } from "../lib/billing/billing-month";
import { summarizeBillingMonth } from "../lib/billing/billing-summary";
import { linkCreditNotes } from "../lib/billing/credit-note-links";
import { planCreditNote, type CreditNoteRequest } from "../lib/billing/credit-note-plan";
import { runCreditNoteIssue } from "../lib/billing/credit-note-run";
import { classifyCfe, toBillerInvoiceRecord } from "../lib/billing/invoice-mapping";
import { buildIssuePlan, getIssueDay } from "../lib/billing/issue-payload";

// Smoke de la 43 contra Biller test, sin base: emite dos e-Tickets (101) o
// dos e-Facturas (111, al receptor de la última e-Factura de test), una nota
// parcial de una y una por el total de la otra (con el mismo envío que la
// página), espera el estado final, lee el detalle de Biller y comprueba las
// referencias, el vínculo de "Emitidas" y el neto del resumen. Emite en
// Biller test. Uso: pnpm exec tsx scripts/smoke-billing-credit-note.ts [101|111]
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const config = resolveBillerConfig({
  BILLER_BASE_URL: process.env.BILLER_BASE_URL,
  BILLER_SUCURSAL: process.env.BILLER_SUCURSAL,
  BILLER_TOKEN: process.env.BILLER_TOKEN,
});
if (config.environment !== "test") throw new Error("El smoke corre solo contra Biller test");
const reader = createBillerReader(createBillerGet(config));
const issuer = createBillerIssuer(config);
const findByInternalNumber = (internalNumber: string) =>
  reader.findByInternalNumber(internalNumber, getLookupCreationWindow(new Date()));
const run = `SMOKE43-${Date.now().toString(36)}`;

const items = [
  { cantidad: 1, codigo: null, concepto: "Limpieza noviembre", descripcion: null, indicador_facturacion: 3, precio: 2500, unidad_medida: null },
  { cantidad: 1, codigo: null, concepto: "Productos", descripcion: null, indicador_facturacion: 3, precio: 500, unidad_medida: null },
];

const cfeType = Number(process.argv[2] ?? 101);
if (cfeType !== 101 && cfeType !== 111) throw new Error("Uso: smoke-billing-credit-note.ts [101|111]");
const DAY_MS = 24 * 60 * 60 * 1000;

// El receptor de la última e-Factura emitida en test (las de 111 piden RUT).
const findReceiver = async () => {
  if (cfeType === 101) return null;
  const to = new Date();
  const window = { from: toBillerDateTime(new Date(to.getTime() - 60 * DAY_MS)), to: toBillerDateTime(to) };
  const last = (await reader.listInvoices(window)).filter((row) => row.tipo_comprobante === 111).at(-1);
  if (!last) throw new Error("No hay e-Facturas en test de los últimos 60 días");
  return toBillerInvoiceRecord(last).receiver;
};
const toBillerDateTime = (day: Date) => `${day.toISOString().slice(0, 10)} 00:00:00`;

const issueTicket = async (suffix: string, receiver: Awaited<ReturnType<typeof findReceiver>>) => {
  const plan = buildIssuePlan(
    { adenda: null, cfeType, currency: "UYU", dueDays: null, internalNumber: `${run}-${suffix}`, items, paymentForm: 1, receiver },
    getIssueDay(new Date())
  );
  if (!plan.ok) throw new Error(plan.error);
  const cfe = await issuer.issue(plan.payload);
  console.log(`CFE ${cfeType} ${cfe.series} ${cfe.number} (id ${cfe.billerId})`);
  return cfe.billerId;
};

const readRecord = async (billerId: number) => {
  const detail = await reader.getInvoiceDetail(billerId);
  return { detail, record: toBillerInvoiceRecord(detail, detail) };
};

const issueNote = async (invoiceId: number, request: CreditNoteRequest, suffix: string, reason: string) => {
  const { record } = await readRecord(invoiceId);
  const creditable = { ...record, items: record.detail?.items ?? null, total: Number(record.total) };
  const plan = planCreditNote(creditable, [], request);
  if (!plan.ok) throw new Error(plan.error);
  const reference = { billerId: record.billerId, cfeType: record.cfeType, issueDate: record.issueDate, number: record.number, series: record.series };
  const input = { cfeType: plan.cfeType, currency: record.currency, internalNumber: `${run}-${suffix}`, items: plan.items, paymentForm: 1, reason, receiver: record.receiver, reference };
  const result = await runCreditNoteIssue(suffix, {
    findByInternalNumber, issuer, now: () => new Date(), sleep,
    store: { load: async () => input, save: async () => undefined },
  });
  console.log(`Nota ${suffix} (${request.mode}, total ${plan.total}):`, result);
  if (result.kind !== "issued" && result.kind !== "found") throw new Error("La nota no se emitió");
  return (await findByInternalNumber(input.internalNumber))!.id;
};

const main = async () => {
  const receiver = await findReceiver();
  const partialTicket = await issueTicket("t1", receiver);
  const fullTicket = await issueTicket("t2", receiver);
  const partialNote = await issueNote(partialTicket, { lines: [{ amount: 1000, index: 0 }, { amount: 0, index: 1 }], mode: "partial" }, "n1", "Dos visitas no realizadas");
  const fullNote = await issueNote(fullTicket, { mode: "full" }, "n2", "Anulación de la factura");

  let records = [] as Awaited<ReturnType<typeof readRecord>>[];
  for (let round = 0; round < 24; round += 1) {
    records = await Promise.all([partialTicket, fullTicket, partialNote, fullNote].map(readRecord));
    if (records.every(({ record }) => record.status !== "ISSUED")) break;
    await sleep(15_000);
  }
  console.table(records.map(({ detail, record }) => ({
    id: record.billerId, tipo: record.cfeType, cfe: `${record.series} ${record.number}`, total: record.total, estado: record.billerStatus,
    referencias: JSON.stringify(record.detail?.referenceIds ?? []),
    adenda: record.adenda,
    referenciado_por: JSON.stringify((detail as { referenciado_por?: { id?: number }[] }).referenciado_por?.map((row) => row.id) ?? []),
  })));

  const notes = records.filter(({ record }) => classifyCfe(record.cfeType) === "credit_note").map(({ record }) => ({
    cfeType: record.cfeType, id: String(record.billerId), issueDate: record.issueDate, number: record.number,
    referenceIds: record.detail?.referenceIds ?? [], series: record.series, status: record.status, total: Number(record.total),
  }));
  const tickets = records.filter(({ record }) => record.cfeType === cfeType).map(({ record }) => ({ billerId: record.billerId, total: Number(record.total) }));
  console.log("Emitidas:", Object.fromEntries(linkCreditNotes(tickets, notes)));
  console.log("Resumen:", summarizeBillingMonth(records.map(({ record }) => record)));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

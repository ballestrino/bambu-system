import "dotenv/config";

import { PrismaClient } from "@prisma/client";

import { resolveBillerConfig } from "../lib/billing/biller-config";
import { createBillerGet, createBillerGetText } from "../lib/billing/biller-http";
import { createBillerIssuer } from "../lib/billing/biller-issue";
import { createBillerReader } from "../lib/billing/biller-read";
import { addBillingMonths, getLookupCreationWindow, parseBillingPeriod } from "../lib/billing/billing-month";
import { createRepeatDraft } from "../lib/billing/draft-store";
import { updateDraftInvoice } from "../lib/billing/draft-update";
import { claimBatchIssue, claimBatchResume, ISSUE_STALE_MS } from "../lib/billing/issue-claim";
import { runBatchIssue } from "../lib/billing/issue-run";
import { createIssueRunStore } from "../lib/billing/issue-store";
import { createInvoiceSyncStore } from "../lib/billing/invoice-store";
import { syncBillerPeriod } from "../lib/billing/invoice-sync-core";

// Smoke de la 41 contra Biller test y la base de .env: deja marcadas solo las
// facturas del tipo pedido, prueba los rechazos (updatedAt viejo, otra
// cantidad, doble clic), emite, reintenta una como si se hubiera perdido la
// respuesta (no duplica), espera el estado final ante DGI y baja el PDF.
// Emite en Biller test. Uso: pnpm exec tsx scripts/smoke-billing-issue.ts 2026-11 101
const db = new PrismaClient();
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const main = async () => {
  const period = parseBillingPeriod(process.argv[2] ?? "");
  const cfeType = Number(process.argv[3]);
  if (!period || !cfeType) throw new Error("Uso: smoke-billing-issue.ts AAAA-MM <tipo de CFE>");
  const config = resolveBillerConfig({
    BILLER_BASE_URL: process.env.BILLER_BASE_URL,
    BILLER_SUCURSAL: process.env.BILLER_SUCURSAL,
    BILLER_TOKEN: process.env.BILLER_TOKEN,
  });
  if (config.environment !== "test") throw new Error("El smoke corre solo contra Biller test");
  console.log(`Base: ${new URL(process.env.DATABASE_URL ?? "postgres://sin-base").hostname}`);

  const reader = createBillerReader(createBillerGet(config));
  const sync = (month: Date) => syncBillerPeriod(month, { now: new Date(), reader, store: createInvoiceSyncStore(db) });
  await sync(addBillingMonths(period, -1));
  await sync(period);

  const admin = await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!admin) throw new Error("No hay un admin en la base");
  const draft = await createRepeatDraft(db, { period, userId: admin.id });
  if (!("batchId" in draft)) throw new Error("No hay borrador para emitir");
  const { batchId } = draft;

  // Solo quedan marcadas las del tipo pedido (por la misma vía que la página).
  const drafts = await db.invoice.findMany({ where: { batchId, status: "DRAFT" }, select: { cfeType: true, id: true, selected: true, updatedAt: true } });
  for (const invoice of drafts) {
    const selected = invoice.cfeType === cfeType;
    if (invoice.selected !== selected) {
      await updateDraftInvoice(db, { invoiceId: invoice.id, selected, updatedAt: invoice.updatedAt.toISOString() });
    }
  }

  const batch = await db.invoiceBatch.findUniqueOrThrow({ where: { id: batchId }, select: { updatedAt: true } });
  const marked = await db.invoice.findMany({ where: { batchId, selected: true, status: "DRAFT" }, select: { id: true, total: true } });
  const request = {
    batchId,
    count: marked.length,
    total: Math.round(marked.reduce((sum, invoice) => sum + Number(invoice.total), 0) * 100) / 100,
    updatedAt: batch.updatedAt.toISOString(),
  };
  console.log("Lo que vería el diálogo:", request);

  console.log("Con un updatedAt viejo:", await claimBatchIssue(db, { ...request, updatedAt: new Date(0).toISOString() }, new Date()));
  console.log("Con otra cantidad:", await claimBatchIssue(db, { ...request, count: request.count + 1 }, new Date()));
  console.log("Doble clic:", await Promise.all([1, 2].map(() => claimBatchIssue(db, request, new Date()))));

  const deps = {
    findByInternalNumber: (internalNumber: string) => reader.findByInternalNumber(internalNumber, getLookupCreationWindow(new Date())),
    issuer: createBillerIssuer(config),
    now: () => new Date(),
    sleep,
    store: createIssueRunStore(db),
  };
  console.log("Emisión:", await runBatchIssue(batchId, deps));
  console.log("Emitir de nuevo el mismo borrador:", await claimBatchIssue(db, { ...request, count: 0, total: 0, updatedAt: (await db.invoiceBatch.findUniqueOrThrow({ where: { id: batchId } })).updatedAt.toISOString() }, new Date()));

  // Una respuesta perdida: la factura queda UNKNOWN y se reintenta.
  const issued = await db.invoice.findFirstOrThrow({ where: { batchId, billerId: { not: null }, cfeType }, select: { billerId: true, id: true, internalNumber: true } });
  await db.invoice.update({ where: { id: issued.id }, data: { status: "UNKNOWN" } });
  console.log("Reintento de una sin confirmar:", await claimBatchResume(db, batchId, new Date(Date.now() + ISSUE_STALE_MS)));
  console.log("Emisión del reintento:", await runBatchIssue(batchId, deps));
  const again = await db.invoice.findUniqueOrThrow({ where: { id: issued.id }, select: { billerId: true, status: true } });
  const inBiller = await createBillerGet(config)("/v2/comprobantes/obtener", { ...toQuery(getLookupCreationWindow(new Date())), numero_interno: issued.internalNumber ?? "" });
  console.log("Mismo comprobante:", again.billerId === issued.billerId, "· en Biller con ese número interno:", (inBiller as unknown[]).length);

  for (let round = 0; round < 24; round += 1) {
    await sync(period);
    const rows = await db.invoice.findMany({ where: { batchId, billerId: { not: null } }, select: { billerStatus: true, internalNumber: true, number: true, series: true, status: true } });
    console.table(rows);
    if (rows.every((row) => row.status === "ACCEPTED" || row.status === "REJECTED")) break;
    await sleep(20_000);
  }

  const getText = createBillerGetText(config);
  const pdf = Buffer.from((await getText("/v2/comprobantes/pdf", { id: issued.billerId! })).trim().replace(/^"|"$/g, ""), "base64");
  console.log("PDF:", pdf.subarray(0, 5).toString("latin1"), `${pdf.length} bytes`);
};

const toQuery = (window: { from: string; to: string }) => ({ desde: window.from, hasta: window.to });

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

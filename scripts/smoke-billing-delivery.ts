import "dotenv/config";

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { PrismaClient } from "@prisma/client";

import { toIssuedRow } from "../lib/billing/billing-issued-view";
import { getDeliverySummary } from "../lib/billing/invoice-delivery";
import { addManualDelivery, findSentRequest, recordSystemDeliveries, removeManualDelivery } from "../lib/billing/invoice-delivery-store";

// Smoke de la 53 contra la base de DATABASE_URL, sin Biller ni Resend: el
// registro de envíos de una factura emitida de prueba (lo que manda Bambú y lo
// anotado a mano). Borra la factura, las filas y el usuario de prueba al final.
// Uso: pnpm exec tsx scripts/smoke-billing-delivery.ts
const db = new PrismaClient();

const run = async () => {
  const user = await db.user.create({ data: { email: `smoke-delivery-${randomUUID()}@example.com`, name: "Smoke Envíos" } });
  const invoice = await db.invoice.create({
    data: {
      origin: "BILLER", status: "ACCEPTED", cfeType: 111, period: new Date("2026-11-01T00:00:00Z"), issueDate: new Date("2026-11-03T00:00:00Z"),
      total: 3660, billerId: 900000000 + Math.floor(Math.random() * 1_000_000), series: "A", number: 123,
      receiver: { tipo_documento: 2, documento: "219876540017", razon_social: "Smoke Envíos S.A.", nombre_fantasia: null,
        sucursal: { direccion: null, ciudad: null, departamento: null, pais: "UY", emails: ["admin@smoke.uy"] } },
    },
  });
  const rejected = await db.invoice.create({
    data: { origin: "APP", status: "REJECTED", cfeType: 111, period: new Date("2026-11-01T00:00:00Z"), total: 100, billerId: invoice.billerId! + 1 },
  });
  try {
    // Lo que mandó Bambú: una fila por correo; el mismo pedido no duplica.
    const requestId = randomUUID();
    const sent = { invoiceId: invoice.id, messageId: "resend-smoke", recipients: ["cliente@ejemplo.com", "contador@ejemplo.com"], requestId, subject: "Factura" };
    assert.equal((await recordSystemDeliveries(db, sent, user.id)).count, 2);
    assert.equal((await recordSystemDeliveries(db, sent, user.id)).count, 0);
    assert.deepEqual((await findSentRequest(db, requestId)).map((row) => row.recipient).sort(), ["cliente@ejemplo.com", "contador@ejemplo.com"]);
    assert.equal((await findSentRequest(db, randomUUID())).length, 0);

    // A mano: WhatsApp y otro correo; repetidos (también +598 contra 0) no.
    const whatsapp = await addManualDelivery(db, { channel: "WHATSAPP", invoiceId: invoice.id, recipient: "099 888 777" }, user.id);
    assert.ok("id" in whatsapp && whatsapp.recipient === "099888777");
    assert.deepEqual(await addManualDelivery(db, { channel: "WHATSAPP", invoiceId: invoice.id, recipient: "+598 99 888 777" }, user.id), { error: "duplicate" });
    assert.deepEqual(await addManualDelivery(db, { channel: "EMAIL", invoiceId: invoice.id, recipient: "Cliente@Ejemplo.com" }, user.id), { error: "duplicate" });
    const manualEmail = await addManualDelivery(db, { channel: "EMAIL", invoiceId: invoice.id, recipient: "Gerencia@Ejemplo.com" }, user.id);
    assert.ok("id" in manualEmail && manualEmail.recipient === "gerencia@ejemplo.com");
    const invalid = await addManualDelivery(db, { channel: "WHATSAPP", invoiceId: invoice.id, recipient: "12" }, user.id);
    assert.ok("error" in invalid && invalid.error === "invalid");
    assert.deepEqual(await addManualDelivery(db, { channel: "EMAIL", invoiceId: rejected.id, recipient: "a@b.com" }, user.id), { error: "not_sendable" });
    assert.deepEqual(await addManualDelivery(db, { channel: "EMAIL", invoiceId: "no-existe", recipient: "a@b.com" }, user.id), { error: "not_found" });

    // Quitar: lo anotado sí, lo que mandó Bambú no.
    const system = await db.invoiceDelivery.findFirstOrThrow({ where: { invoiceId: invoice.id, source: "SYSTEM" } });
    assert.deepEqual(await removeManualDelivery(db, { deliveryId: system.id }, user.id), { error: "system" });
    assert.deepEqual(await removeManualDelivery(db, { deliveryId: manualEmail.id }, user.id), { ok: true, recipient: "gerencia@ejemplo.com" });
    assert.deepEqual(await removeManualDelivery(db, { deliveryId: manualEmail.id }, user.id), { error: "not_found" });

    // La fila de "Emitidas" lee lo mismo que la página.
    const stored = await db.invoice.findUniqueOrThrow({
      where: { id: invoice.id },
      include: { deliveries: { select: { channel: true, createdBy: { select: { name: true } }, id: true, recipient: true, sentAt: true, source: true } } },
    });
    const row = toIssuedRow(stored, new Map());
    assert.equal(row.canSend, true);
    assert.deepEqual(row.receiverEmails, ["admin@smoke.uy"]);
    assert.deepEqual(row.deliveries.map((item) => `${item.channel} ${item.recipient} ${item.source}`), [
      "EMAIL cliente@ejemplo.com SYSTEM", "EMAIL contador@ejemplo.com SYSTEM", "WHATSAPP 099888777 MANUAL",
    ]);
    assert.equal(row.deliveries[2]?.by, "Smoke Envíos");
    assert.deepEqual(getDeliverySummary(row.deliveries), { email: ["cliente@ejemplo.com", "contador@ejemplo.com"], whatsapp: ["099888777"] });

    // Auditoría: un envío, dos anotaciones y un borrado.
    const audits = await db.agentAuditEvent.findMany({ where: { entityId: invoice.id }, select: { action: true } });
    assert.deepEqual(audits.map((item) => item.action).sort(), ["invoice.delivery.add", "invoice.delivery.add", "invoice.delivery.remove", "invoice.send"]);
    console.log("smoke-billing-delivery OK");
  } finally {
    await db.agentAuditEvent.deleteMany({ where: { entityId: { in: [invoice.id, rejected.id] } } });
    await db.invoice.deleteMany({ where: { id: { in: [invoice.id, rejected.id] } } });
    await db.user.delete({ where: { id: user.id } });
    await db.$disconnect();
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

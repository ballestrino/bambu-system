"use server";

import { getReceiverName, readStoredReceiver } from "@/lib/billing/invoice-json";
import { getReceiverKey } from "@/lib/billing/receiver-job";
import { db } from "@/lib/db";
import { AdminAuthorizationError, requireAdminSession } from "@/lib/require-admin-session";
import { receiverJobLinkSchema } from "@/schemas/billing";

// Vincula el receptor de una factura con su trabajo de Bambú, o quita el
// vínculo (feature 43). Lo confirma una persona desde Facturación: el agente
// solo lo sugiere. Un receptor tiene un solo trabajo; vincular otro lo cambia.
export const setReceiverJob = async (values: unknown) => {
  try {
    const session = await requireAdminSession();
    const parsed = receiverJobLinkSchema.safeParse(values);
    if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };

    const invoice = await db.invoice.findUnique({ where: { id: parsed.data.invoiceId }, select: { receiver: true } });
    if (!invoice) return { error: "La factura ya no existe" };
    const receiver = readStoredReceiver(invoice.receiver);
    const receiverKey = getReceiverKey(receiver);
    if (!receiverKey) return { error: "Un consumidor final sin datos no se vincula a un trabajo" };

    if (parsed.data.jobId === null) {
      await db.billingReceiverJob.deleteMany({ where: { receiverKey } });
      return { success: "Se quitó el trabajo" };
    }
    const job = await db.job.findFirst({
      where: { archivedAt: null, id: parsed.data.jobId, status: { not: "ARCHIVED" } },
      select: { id: true, name: true },
    });
    if (!job) return { error: "El trabajo no existe o está archivado" };

    const receiverName = getReceiverName(receiver);
    await db.billingReceiverJob.upsert({
      where: { receiverKey },
      create: { createdById: session.user.id, jobId: job.id, receiverKey, receiverName },
      update: { createdById: session.user.id, jobId: job.id, receiverName },
    });
    return { success: `${receiverName} quedó vinculado a ${job.name}` };
  } catch (error) {
    if (error instanceof AdminAuthorizationError) return { error: error.message };
    console.error("Error linking billing receiver to job:", error);
    return { error: "No se pudo guardar el vínculo" };
  }
};

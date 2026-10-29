import { z } from "zod";

import { MAILBOX_FOLDERS, MAILBOX_IDS } from "@/lib/mailbox/accounts";

// Entradas de las tools de correo, planas y nullable como las demás (ver
// schemas/agent-tools.ts): null es "sin dato" o el valor por defecto.
export const MAX_LISTED_EMAILS = 40;
export const MAX_BUDGET_REQUESTS = 40;

export const BUDGET_REQUEST_PLACES = ["hogar", "oficina", "edificio", "otro"] as const;

export const emailRefSchema = z
  .string()
  .trim()
  .regex(/^(contacto|comercial)\/(inbox|sent)\/[1-9]\d{0,9}$/, "Usá el ref que devolvió listEmails, como contacto/inbox/1234")
  .describe("El ref del correo tal como lo devolvió listEmails, como contacto/inbox/1234");

export const listEmailsInputSchema = z.object({
  mailbox: z.enum(MAILBOX_IDS).nullable().describe("contacto o comercial; null lee las dos"),
  folder: z.enum(MAILBOX_FOLDERS).nullable().describe("inbox (recibidos) o sent (enviados); null es inbox"),
  unreadOnly: z.boolean().nullable().describe("true trae solo los no leídos; null trae todos"),
  days: z.number().int().min(1).max(90).nullable().describe("Días hacia atrás; null son 14"),
  search: z.string().trim().min(2).max(80).nullable().describe("Texto a buscar en asunto, remitente o cuerpo"),
  limit: z.number().int().min(1).max(MAX_LISTED_EMAILS).nullable().describe("Cuántos correos; null son 15"),
});

export const MAX_READ_EMAILS = 8;

export const readEmailInputSchema = z.object({
  refs: z.array(emailRefSchema).min(1).max(MAX_READ_EMAILS).describe("Los refs de los correos a abrir, hasta 8 juntos"),
});

export const budgetRequestSchema = z.object({
  emailRef: emailRefSchema.nullable().describe("El correo del pedido; null si vino por otro lado"),
  client: z.string().trim().min(1).max(120).nullable().describe("Cliente o remitente, para mostrarlo"),
  place: z.enum(BUDGET_REQUEST_PLACES).describe("Dónde es el servicio: los precios oficiales son distintos para hogar y oficina"),
  frequency: z.enum(["days", "week", "month"]).describe("days: puntuales; week: por semana; month: por mes"),
  visits: z.number().int().positive().max(60).describe("Visitas por período"),
  hoursPerVisit: z.number().positive().max(24).describe("Horas por visita"),
  employees: z.number().int().positive().max(20).nullable().describe("Empleadas por visita; null es 1"),
  hasProducts: z.boolean().nullable().describe("true con productos, false sin productos, null si no lo dice"),
});

export const groupBudgetRequestsInputSchema = z.object({
  requests: z
    .array(budgetRequestSchema)
    .min(1)
    .max(MAX_BUDGET_REQUESTS)
    .describe("Un elemento por pedido de presupuesto, con el servicio que sacaste del correo"),
});

export type BudgetRequestInput = z.infer<typeof budgetRequestSchema>;

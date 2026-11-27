import { z } from "zod";

import { replyDocSchema, replyDocToText } from "@/lib/web-forms/reply-doc";

// Formularios de la web pública (feature 74). La web manda multipart con estos
// campos; el CV va aparte (ver lib/web-forms/file-type.ts).
const trimmed = (max: number, message: string) => z.string().trim().min(1, message).max(max, message);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value || null);

export const webFormInboundSchema = z.object({
  externalId: z.string().trim().regex(/^[A-Za-z0-9_-]{8,64}$/, "externalId inválido"),
  kind: z.enum(["CONTACT", "JOB_APPLICATION"]),
  name: trimmed(120, "Nombre inválido"),
  email: z.string().trim().toLowerCase().email("Email inválido").max(254),
  phone: trimmed(40, "Teléfono inválido"),
  service: optionalText(120),
  location: optionalText(160),
  message: z.string().trim().max(5000, "Mensaje demasiado largo").default(""),
  fromTrebol: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
});

export type WebFormInbound = z.infer<typeof webFormInboundSchema>;

export const webFormIdSchema = z.string().cuid();

export const webFormStatusSchema = z.enum(["NEW", "REPLIED", "ARCHIVED"]);

export const webFormKindFilterSchema = z.enum(["ALL", "CONTACT", "JOB_APPLICATION"]);

export const listWebFormsSchema = z.object({
  status: z.enum(["NEW", "REPLIED", "ARCHIVED", "ALL"]).default("NEW"),
  kind: webFormKindFilterSchema.default("ALL"),
  search: z.string().trim().max(120).default(""),
});

export type ListWebFormsInput = z.input<typeof listWebFormsSchema>;

export const setWebFormStatusSchema = z.object({
  id: webFormIdSchema,
  status: webFormStatusSchema,
});

export type SetWebFormStatusInput = z.infer<typeof setWebFormStatusSchema>;

export const replyWebFormSchema = z.object({
  id: webFormIdSchema,
  requestId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, "Pedido inválido"),
  subject: z.string().trim().min(1, "Escribí un asunto").max(200, "El asunto puede tener hasta 200 caracteres"),
  // El mensaje con formato (lib/web-forms/reply-doc.ts); el largo se mide en
  // su texto.
  content: replyDocSchema.superRefine((doc, ctx) => {
    const length = replyDocToText(doc).trim().length;
    if (length < 2) ctx.addIssue({ code: "custom", message: "Escribí la respuesta" });
    if (length > 10000) ctx.addIssue({ code: "custom", message: "La respuesta puede tener hasta 10.000 caracteres" });
  }),
  // Cita el mensaje original al final del correo.
  quoteOriginal: z.boolean().default(true),
  // Agrega "Saludos," antes de los datos de la empresa.
  includeClosing: z.boolean().default(true),
});

export type ReplyWebFormInput = z.input<typeof replyWebFormSchema>;

export const setWebFormKindSchema = z.object({
  id: webFormIdSchema,
  kind: z.enum(["CONTACT", "JOB_APPLICATION"]),
});

export type SetWebFormKindInput = z.infer<typeof setWebFormKindSchema>;

// Qué avisos de la Bandeja de entrada de contacto@ se mueven a su carpeta.
export const sortWebFormMailSchema = z.object({ kind: z.enum(["CONTACT", "JOB_APPLICATION"]) });

export type SortWebFormMailInput = z.infer<typeof sortWebFormMailSchema>;

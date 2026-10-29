import { z } from "zod";

import { AGENT_MEMORY_KINDS, MEMORY_SOURCES, MEMORY_TEXT_MAX } from "@/lib/agent/memory";

// Memoria del agente: las entradas de sus tools (obligatorias y nullable, como
// las demás), el payload de SAVE_MEMORY y la edición desde la pantalla.
const idSchema = z.string().trim().min(1).max(64);

const daySchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Usá AAAA-MM-DD");

export const agentMemoryKindSchema = z.enum(AGENT_MEMORY_KINDS);

const textSchema = z.string().trim().min(1, "Escribí qué hay que recordar.").max(MEMORY_TEXT_MAX);

export const proposeMemoryInputSchema = z.object({
  kind: agentMemoryKindSchema.describe(
    "BUSINESS del negocio o una política, CLIENT de un cliente, STYLE de cómo escribir o responder, PRICE un mínimo, descuento o acuerdo de precio"
  ),
  text: textSchema.describe("El dato o la preferencia, corto y en tercera persona, con el nombre del cliente si es de uno"),
  expiresOn: daySchema.nullable().describe("Último día en que vale, AAAA-MM-DD; null si no vence"),
  source: z
    .enum(MEMORY_SOURCES)
    .describe("De dónde sale: user lo dijo el usuario, conversation lo sacaste de la conversación, email de un correo, image de una imagen"),
  replacesId: idSchema.nullable().describe("id de la memoria que este texto reemplaza (de la memoria del equipo o searchMemory); null si es nueva"),
});

export const searchMemoryInputSchema = z.object({
  query: z.string().trim().max(120).nullable().describe("Palabras a buscar en el texto, por ejemplo el nombre de un cliente; null todas"),
  kind: agentMemoryKindSchema.nullable().describe("Solo de un tipo; null todos"),
});

export const saveMemoryPayloadSchema = z.object({
  kind: agentMemoryKindSchema,
  text: textSchema,
  expiresAt: z.iso.datetime().nullable(),
  source: z.enum(MEMORY_SOURCES),
  replacesId: idSchema.nullable(),
  // updatedAt de la memoria reemplazada al proponer: si cambió, no se pisa.
  baseUpdatedAt: z.iso.datetime().nullable(),
});

export const agentMemoryIdSchema = idSchema;

// La pantalla edita el texto, el tipo y el vencimiento (null no vence).
export const updateAgentMemorySchema = z.object({
  id: idSchema,
  kind: agentMemoryKindSchema,
  text: textSchema,
  expiresOn: daySchema.nullable(),
});

export type UpdateAgentMemoryInput = z.infer<typeof updateAgentMemorySchema>;

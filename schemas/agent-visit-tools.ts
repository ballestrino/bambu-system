import { z } from "zod";

import { occurrenceStatusSchema } from "@/schemas/ops/job-occurrence";

// Entradas de las tools de visitas. Como las demás tools del agente, cada
// campo es obligatorio y nullable (null = no cambia) y no hay objetos
// anidados: el agente corre con OpenAI y con Claude.
const idSchema = z.string().trim().min(1).max(64);

const localDateTimeSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/, "Usá AAAA-MM-DD HH:mm");

const occurrenceIdSchema = idSchema.describe("id de la visita, de queryOperations (kind visits)");

export const proposeUpdateVisitInputSchema = z.object({
  occurrenceId: occurrenceIdSchema,
  start: localDateTimeSchema
    .nullable()
    .describe("Inicio programado nuevo, AAAA-MM-DD HH:mm en hora de Montevideo; si cambia solo el inicio se conserva la duración; null no cambia"),
  end: localDateTimeSchema.nullable().describe("Fin programado nuevo, AAAA-MM-DD HH:mm; null no cambia"),
  employeeIds: z
    .array(idSchema)
    .max(20)
    .nullable()
    .describe("El equipo completo después del cambio (ids de queryOperations employees); [] la deja sin equipo; null no cambia"),
  status: occurrenceStatusSchema
    .nullable()
    .describe("SCHEDULED programada, DONE realizada, SKIPPED no se hizo, CANCELED cancelada; null no cambia"),
  actualStart: localDateTimeSchema
    .nullable()
    .describe("Inicio real, AAAA-MM-DD HH:mm; registrarlo marca la visita como realizada; null no cambia"),
  actualEnd: localDateTimeSchema.nullable().describe("Fin real, AAAA-MM-DD HH:mm; null no cambia"),
  notes: z.string().max(2000).nullable().describe('Notas nuevas; "" las borra; null no cambia'),
  scheduleLabel: z
    .string()
    .max(255)
    .nullable()
    .describe('Nombre que ve la empleada en el cronograma; "" vuelve al del trabajo; null no cambia'),
});

export type ProposeUpdateVisitInput = z.infer<typeof proposeUpdateVisitInputSchema>;

export const proposeArchiveVisitInputSchema = z.object({ occurrenceId: occurrenceIdSchema });

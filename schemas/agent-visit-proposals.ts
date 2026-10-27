import { z } from "zod";

import { MAX_PROPOSED_VISITS } from "@/lib/agent/visit-proposals";
import { cuidSchema } from "@/schemas/ops/common";
import { occurrenceStatusSchema } from "@/schemas/ops/job-occurrence";

// Payloads de las propuestas de visitas. Las fechas van en ISO UTC: el patch
// pasa tal cual a updateJobOccurrence, que las convierte con
// UpdateJobOccurrenceSchema. updatedAt y el equipo de cuando se propuso: si
// cambiaron, la propuesta ya no describe lo que se va a guardar.
const isoSchema = z.iso.datetime();

// Solo las claves que cambian; null vacía. Nunca scheduleRuleId, isDetached ni
// generatedStartAt: el agente no despega visitas de su regla.
export const visitPatchSchema = z
  .strictObject({
    scheduledStartAt: isoSchema.optional(),
    scheduledEndAt: isoSchema.optional(),
    employeeIds: z.array(cuidSchema).max(20).optional(),
    status: occurrenceStatusSchema.optional(),
    actualStartAt: isoSchema.nullable().optional(),
    actualEndAt: isoSchema.nullable().optional(),
    notes: z.string().max(5000).nullable().optional(),
    scheduleLabel: z.string().max(255).nullable().optional(),
  })
  .refine((patch) => Object.keys(patch).length > 0, "La propuesta no cambia nada");

export type VisitPatch = z.infer<typeof visitPatchSchema>;

// Un lote de visitas sueltas de un trabajo, ya expandido a horarios: pasa a
// createJobOccurrences, que lo valida otra vez con CreateJobOccurrencesSchema.
export const createVisitsPayloadSchema = z.object({
  jobId: cuidSchema,
  employeeIds: z.array(cuidSchema).max(20),
  notes: z.string().max(5000).nullable(),
  scheduleLabel: z.string().max(255).nullable(),
  visits: z
    .array(z.object({ scheduledStartAt: isoSchema, scheduledEndAt: isoSchema }))
    .min(1)
    .max(MAX_PROPOSED_VISITS),
});

export type CreateVisitsPayload = z.infer<typeof createVisitsPayloadSchema>;

// Las visitas del lote que quedaron marcadas en la tarjeta, por su posición
// en visits: al menos una y sin repetir. Sin selección se crean todas.
export const visitSelectionSchema = z
  .array(z.number().int().min(0).max(MAX_PROPOSED_VISITS - 1))
  .min(1)
  .max(MAX_PROPOSED_VISITS)
  .refine((indexes) => new Set(indexes).size === indexes.length, "Una visita repetida en la selección");

export const visitProposalPayloadSchemas = {
  CREATE_VISITS: createVisitsPayloadSchema,
  UPDATE_VISIT: z.object({
    occurrenceId: cuidSchema,
    baseUpdatedAt: isoSchema,
    baseEmployeeIds: z.array(cuidSchema),
    patch: visitPatchSchema,
  }),
  ARCHIVE_VISIT: z.object({ occurrenceId: cuidSchema, baseUpdatedAt: isoSchema }),
};

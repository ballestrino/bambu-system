import { z } from "zod";

import { cuidSchema, optionalTrimmedString } from "@/schemas/ops/common";
import { optionalEmployeeIdsSchema } from "@/schemas/ops/job-occurrence";

// Varias visitas sueltas de un trabajo, con el mismo equipo, notas y nombre
// para el cronograma. Se crean todas o ninguna (createJobOccurrences).
export const MAX_BATCH_OCCURRENCES = 20;

const batchVisitSchema = z
  .object({
    scheduledStartAt: z.coerce.date(),
    scheduledEndAt: z.coerce.date(),
  })
  .refine((visit) => visit.scheduledEndAt.getTime() > visit.scheduledStartAt.getTime(), {
    message: "La fecha de fin programada debe ser posterior al inicio",
    path: ["scheduledEndAt"],
  });

export const CreateJobOccurrencesSchema = z.object({
  jobId: cuidSchema,
  employeeIds: optionalEmployeeIdsSchema,
  notes: optionalTrimmedString(),
  scheduleLabel: optionalTrimmedString(255),
  visits: z
    .array(batchVisitSchema)
    .min(1)
    .max(MAX_BATCH_OCCURRENCES)
    .refine(
      (visits) => new Set(visits.map((visit) => visit.scheduledStartAt.getTime())).size === visits.length,
      "Dos visitas del lote empiezan a la misma hora"
    ),
});

export type CreateJobOccurrencesInput = z.infer<typeof CreateJobOccurrencesSchema>;

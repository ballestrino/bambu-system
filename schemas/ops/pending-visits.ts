import { z } from "zod";

import { cuidSchema } from "@/schemas/ops/common";

// Resolver de una vez visitas pendientes de registro desde la vista
// Pendientes: asignar una empleada, registrarlas como hechas con el horario
// programado, omitirlas, cancelarlas o eliminarlas (se archivan, como
// "Eliminar visita"). Todas o ninguna.
export const MAX_PENDING_RESOLVE = 500;

export const PENDING_RESOLUTIONS = ["ASSIGN", "DONE", "SKIPPED", "CANCELED", "DELETE"] as const;

export type PendingResolution = (typeof PENDING_RESOLUTIONS)[number];

export const ResolvePendingVisitsSchema = z
  .object({
    action: z.enum(PENDING_RESOLUTIONS),
    employeeId: cuidSchema.optional(),
    jobId: cuidSchema.optional(),
    occurrenceIds: z
      .array(cuidSchema)
      .min(1)
      .max(MAX_PENDING_RESOLVE)
      .refine((ids) => new Set(ids).size === ids.length, "Una visita repetida"),
  })
  .refine((values) => values.action !== "ASSIGN" || Boolean(values.employeeId), {
    message: "Elegí una empleada",
    path: ["employeeId"],
  });

export type ResolvePendingVisitsInput = z.infer<typeof ResolvePendingVisitsSchema>;
